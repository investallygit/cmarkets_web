import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  commodityDecimals,
  useCommodities,
  useCommodity,
  useCommodityNames,
} from '@/entities/commodity'
import type { CommodityPointDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

const DASH = '—'

/**
 * Screen 21, the statistics (spec section 9): the last value and the one before with their dates,
 * the changes over 1 and 3 months, the year, 1 year and 5 years a year, the 12-month high and low
 * with their dates, the 5-year average, the 1-year volatility and correlation with the reference
 * series; then how late the source publishes. API /commodities/{code}.
 */
export function CommodityStatisticsPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const profile = useCommodity(code)
  // The series it is correlated with, by its name (the list's, already loaded beside it).
  const list = useCommodities()
  const referenceName = (reference: string) => {
    const item = list.data?.find((commodity) => commodity.code === reference)
    return item ? names.name(item, true) : reference
  }

  return (
    <Panel title={t('panels.commodityStatistics')} code="DES" bodyClassName="flex min-h-0 flex-col">
      <QueryView query={profile}>
        {(data) => {
          const stats = data.statistics
          const number = (value: number) =>
            format.number(value, commodityDecimals(value, data.unit))
          const dated = (point: CommodityPointDto | null, stale = false) =>
            point ? (
              <>
                {number(point.value)}{' '}
                <span className={stale ? 'text-warning' : 'text-secondary'}>
                  ({format.isoDate(point.date)})
                </span>
              </>
            ) : (
              DASH
            )
          const change = (value: number | null) =>
            value === null ? DASH : <ChangeText value={value} percent decimals={1} />
          const rows: [string, ReactNode][] = [
            [t('commodities.statistics.last'), dated(data.last, data.stale)],
            [t('commodities.statistics.previous'), dated(data.previous)],
            [
              t('commodities.statistics.months'),
              <>
                {change(stats.change1mPct)} · {change(stats.change3mPct)}
              </>,
            ],
            [
              t('commodities.statistics.year'),
              <>
                {change(stats.changeYtdPct)} · {change(stats.change1yPct)}
              </>,
            ],
            [t('commodities.statistics.fiveYears'), change(stats.change5yAnnualPct)],
            [t('commodities.statistics.high12m'), dated(stats.high12m)],
            [t('commodities.statistics.low12m'), dated(stats.low12m)],
            [
              t('commodities.statistics.average5y'),
              stats.average5y === null ? DASH : number(stats.average5y),
            ],
            [
              t('commodities.statistics.volatility'),
              stats.volatility1yPct === null
                ? DASH
                : format.percent(stats.volatility1yPct, 1, false),
            ],
            [
              stats.correlation1y
                ? t('commodities.statistics.correlationWith', {
                    name: referenceName(stats.correlation1y.code),
                  })
                : t('commodities.statistics.correlation'),
              stats.correlation1y ? format.number(stats.correlation1y.value, 2) : DASH,
            ],
          ]
          return (
            <>
              {/* A box the keyboard scrolls too, when a small panel cuts the figures. */}
              <ScrollArea className="min-h-0 flex-1">
                <dl>
                  {rows.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-border/40 px-3 py-1"
                    >
                      <dt className="font-sans text-label text-secondary">{label}</dt>
                      <dd className="font-mono text-data">{value}</dd>
                    </div>
                  ))}
                </dl>
              </ScrollArea>
              <p
                className={clsx(
                  'shrink-0 px-3 py-1.5 font-sans text-title',
                  data.publicationLag === 'byFile' ? 'text-secondary' : 'text-warning',
                )}
              >
                {t(`commodities.lags.${data.publicationLag}.warning`)}
              </p>
            </>
          )
        }}
      </QueryView>
    </Panel>
  )
}
