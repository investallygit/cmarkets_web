import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCommodity, useCommodityNames } from '@/entities/commodity'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 21, the data (spec section 9): the codes at EODHD and at FRED, the primary source, the
 * last time CMarket stored a value, how late the source usually publishes. API /commodities/{code}.
 */
export function CommodityDataPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const profile = useCommodity(code)

  return (
    <Panel title={t('panels.commodityData')} code="DES">
      <QueryView query={profile}>
        {(data) => {
          const codes = data.eodhdCode
            ? [`${data.eodhdCode} (EODHD)`, data.fredCode ? `${data.fredCode} (FRED)` : null]
            : [`${data.code} (${t('commodities.data.file')})`]
          const rows: [string, ReactNode][] = [
            [t('commodities.data.code'), codes.filter(Boolean).join(' · ')],
            [t('commodities.data.source'), names.source(data)],
            [
              t('commodities.data.updated'),
              data.updatedAt
                ? `${format.date(data.updatedAt)} ${format.time(data.updatedAt)}`
                : '—',
            ],
            [t('commodities.data.lag'), t(`commodities.lags.${data.publicationLag}.lag`)],
          ]
          return (
            <dl className="px-3 py-1">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-0.5">
                  <dt className="font-sans text-label text-secondary">{label}</dt>
                  <dd className="text-right font-mono text-data break-words">{value}</dd>
                </div>
              ))}
            </dl>
          )
        }}
      </QueryView>
    </Panel>
  )
}
