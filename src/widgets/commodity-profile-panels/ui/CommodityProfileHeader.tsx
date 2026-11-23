import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  commodityDecimals,
  useCommodity,
  useCommodityItem,
  useCommodityNames,
} from '@/entities/commodity'
import type {
  CommodityListItemDto,
  CommodityPointDto,
  CommodityProfileDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'

const DASH = '—'

interface Figure {
  label: string
  value: ReactNode
}

/**
 * Screen 21 header (spec section 9): the code, the name, its category, unit, frequency (with how
 * it is published) and source; the last value with its date, yellow when older than its series
 * allows, and its change; the key figures: 1 month, YTD, 1 year, the 12-month high and low, the
 * 1-year volatility. What the list knows of the series shows first. API /commodities/{code}.
 */
export function CommodityProfileHeader({ code }: { code: string }) {
  const profile = useCommodity(code).data
  const item = useCommodityItem(code)
  const shown = profile ?? item
  return shown ? (
    <Header item={shown} profile={profile} />
  ) : (
    <section aria-label={code} className="min-h-14 shrink-0 border bg-panel px-3 py-1.5">
      <h1 className="font-mono text-figure font-semibold text-accent-amber">{code}</h1>
    </section>
  )
}

function Header({
  item,
  profile,
}: {
  item: CommodityListItemDto
  profile: CommodityProfileDto | undefined
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const stats = profile?.statistics
  const value = (point: CommodityPointDto | null | undefined) =>
    point ? format.number(point.value, commodityDecimals(point.value, item.unit)) : DASH
  const change = (pct: number | null | undefined) =>
    pct == null ? DASH : <ChangeText value={pct} percent decimals={1} />
  const figures: Figure[] = [
    { label: t('commodities.figures.month'), value: change(stats?.change1mPct) },
    { label: t('commodities.figures.ytd'), value: change(stats?.changeYtdPct) },
    { label: t('commodities.figures.year'), value: change(stats?.change1yPct) },
    { label: t('commodities.figures.high12m'), value: value(stats?.high12m) },
    { label: t('commodities.figures.low12m'), value: value(stats?.low12m) },
    {
      label: t('commodities.figures.volatility'),
      value:
        stats?.volatility1yPct == null ? DASH : format.percent(stats.volatility1yPct, 1, false),
    },
  ]
  const details = [
    t(`commodities.categories.${item.category}`),
    names.unit(item.unit),
    ...(profile
      ? [
          t(`commodities.lags.${profile.publicationLag}.frequency`, {
            frequency: names.frequency(profile.frequency),
          }),
          t('commodities.header.source', {
            source:
              profile.origin === 'eodhd'
                ? t('commodities.header.viaEodhd', { source: names.source(profile) })
                : names.source(profile),
          }),
        ]
      : [names.frequency(item.frequency)]),
  ]

  return (
    <section
      aria-label={item.code}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="shrink-0 font-mono text-figure font-semibold text-accent-amber">
          {item.code}
        </h1>
        <div className="min-w-0 basis-60 grow">
          {/* Both lines wrap: on a phone, the source would be cut. */}
          <p className="font-sans text-label font-semibold">{names.name(item)}</p>
          <p className="font-sans text-data text-secondary">{details.join(' · ')}</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-price font-semibold">
            <span className="sr-only">{t('commodities.header.last')} </span>
            {value(item.last)}
          </span>
          {item.changePct !== null && (
            <span title={t('commodities.header.change')}>
              <ChangeText
                value={item.changePct}
                percent
                decimals={1}
                showIcon
                className="font-mono text-label font-semibold"
              />
            </span>
          )}
        </div>
        {item.last && (
          <span
            className={clsx('font-mono text-title', item.stale ? 'text-warning' : 'text-secondary')}
          >
            {t('commodities.header.asOf', { date: format.isoDate(item.last.date) })}
            {item.stale && <span className="sr-only"> {t('commodities.stale')}</span>}
          </span>
        )}
      </div>
      <dl className="ml-auto flex flex-wrap gap-x-8 gap-y-1">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-0.5">
            <dt className="font-sans text-title text-secondary">{figure.label}</dt>
            <dd className="font-mono text-data font-semibold">{figure.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
