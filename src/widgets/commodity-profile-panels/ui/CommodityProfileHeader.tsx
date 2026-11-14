import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { commodityDecimals, useCommodity, useCommodityNames } from '@/entities/commodity'
import type { CommodityPointDto, CommodityProfileDto } from '@/shared/api/contracts'
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
 * 1-year volatility. API /commodities/{code}.
 */
export function CommodityProfileHeader({ code }: { code: string }) {
  const profile = useCommodity(code).data
  return profile ? (
    <Header profile={profile} />
  ) : (
    <section aria-label={code} className="min-h-14 shrink-0 border bg-panel px-3 py-1.5">
      <h1 className="font-mono text-figure font-semibold text-accent-amber">{code}</h1>
    </section>
  )
}

function Header({ profile }: { profile: CommodityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const stats = profile.statistics
  const value = (point: CommodityPointDto | null) =>
    point ? format.number(point.value, commodityDecimals(point.value, profile.unit)) : DASH
  const change = (pct: number | null) =>
    pct === null ? DASH : <ChangeText value={pct} percent decimals={1} />
  const figures: Figure[] = [
    { label: t('commodities.figures.month'), value: change(stats.change1mPct) },
    { label: t('commodities.figures.ytd'), value: change(stats.changeYtdPct) },
    { label: t('commodities.figures.year'), value: change(stats.change1yPct) },
    { label: t('commodities.figures.high12m'), value: value(stats.high12m) },
    { label: t('commodities.figures.low12m'), value: value(stats.low12m) },
    {
      label: t('commodities.figures.volatility'),
      value:
        stats.volatility1yPct === null ? DASH : format.percent(stats.volatility1yPct, 1, false),
    },
  ]
  const details = [
    t(`commodities.categories.${profile.category}`),
    names.unit(profile.unit),
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

  return (
    <section
      aria-label={profile.code}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="shrink-0 font-mono text-figure font-semibold text-accent-amber">
          {profile.code}
        </h1>
        <div className="min-w-0 basis-60 grow">
          {/* Both lines wrap: on a phone, the source would be cut. */}
          <p className="font-sans text-label font-semibold">{names.name(profile)}</p>
          <p className="font-sans text-data text-secondary">{details.join(' · ')}</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-price font-semibold">
            <span className="sr-only">{t('commodities.header.last')} </span>
            {value(profile.last)}
          </span>
          {profile.changePct !== null && (
            <span title={t('commodities.header.change')}>
              <ChangeText
                value={profile.changePct}
                percent
                decimals={1}
                showIcon
                className="font-mono text-label font-semibold"
              />
            </span>
          )}
        </div>
        {profile.last && (
          <span
            className={clsx(
              'font-mono text-title',
              profile.stale ? 'text-warning' : 'text-secondary',
            )}
          >
            {t('commodities.header.asOf', { date: format.isoDate(profile.last.date) })}
            {profile.stale && <span className="sr-only"> {t('commodities.stale')}</span>}
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
