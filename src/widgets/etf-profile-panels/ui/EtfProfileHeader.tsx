import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useEtf, useEtfLabels, useEtfPerformance } from '@/entities/etf'
import { useLiveQuote, useQuote } from '@/entities/quote'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { ChangeText } from '@/shared/ui/ChangeText'
import { CountryFlag } from '@/shared/ui/CountryFlag'
import { DASH } from './words'

interface Figure {
  label: string
  value: ReactNode
}

/**
 * Screen 19 header: the flag and code of the fund's domicile, the ticker, the full name, the line
 * of its description (class, provider, exchange, currency, UCITS, accumulating or distributing),
 * the price and its change, then the key figures: NAV, premium or discount, TER, AUM, 30-day
 * average volume, YTD and 1Y volatility. API /etfs/{id}, /etfs/{id}/performance and
 * /securities/{id}/quote.
 */
export function EtfProfileHeader({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const etf = useEtf(profile.id).data
  const performance = useEtfPerformance(profile.id).data
  const quote = useQuote(profile.id).data
  const live = useLiveQuote(profile.id)
  const last = live?.last ?? quote?.last
  const changePct = live?.changePct ?? quote?.changePct
  const currency = etf?.identification.currency ?? profile.currency
  const domicile = etf?.structure.domicile ?? profile.country
  const size = etf?.size
  const ytd = performance?.returns.find((row) => row.period === 'YTD')?.etfPct ?? null
  const percent = (value: number | null | undefined, decimals: number) =>
    value === null || value === undefined ? DASH : format.percent(value, decimals, false)

  const figures: Figure[] = [
    {
      label: t('etfProfile.figures.nav'),
      value: size?.nav == null ? DASH : labels.price(size.nav, currency),
    },
    {
      label: t('etfProfile.figures.premium'),
      value:
        size?.premiumDiscountPct == null ? (
          DASH
        ) : (
          <ChangeText value={size.premiumDiscountPct} percent />
        ),
    },
    { label: t('etfProfile.figures.ter'), value: percent(etf?.costs.terPct, 2) },
    {
      label: t('etfProfile.figures.aum'),
      value: size?.aum == null ? DASH : labels.size(size.aum, currency),
    },
    {
      label: t('etfProfile.figures.volume'),
      // "1.4 M", "610 K" (the mockup's "X.X M").
      value:
        size?.averageVolume == null
          ? DASH
          : format.compact(size.averageVolume, size.averageVolume >= 1e6 ? 1 : 0),
    },
    {
      label: t('etfProfile.figures.ytd'),
      value: ytd === null ? DASH : <ChangeText value={ytd} percent decimals={1} />,
    },
    { label: t('etfProfile.figures.volatility'), value: percent(performance?.volatility1yPct, 1) },
  ]

  const a = etf?.identification
  const details = a
    ? [
        t('etfProfile.classLine', {
          assetClass: labels.assetClass(a.assetClass),
          geography: labels.geography(a.geography),
        }),
        a.brand ? `${a.issuer} (${a.brand})` : a.issuer,
        labels.exchange(a.exchange),
        a.currency,
        etf.structure.ucits ? t('etf.ucits') : t('etf.nonUcits'),
        t(`etfProfile.policies.${etf.structure.distribution}`),
      ]
    : [t('security.types.etf'), profile.exchange, format.country(profile.country), profile.currency]

  return (
    <section
      aria-label={profile.code}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      {/* On a narrow screen the name and the description go below the code rather than cut short. */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex shrink-0 items-center gap-1.5 border bg-panel-header px-1.5 py-0.5 font-mono text-data font-semibold text-secondary">
          <CountryFlag
            code={domicile}
            label={t('etfScreener.domicile', { country: format.country(domicile) })}
          />
          {domicile}
        </span>
        <h1 className="shrink-0 font-mono text-figure font-semibold text-accent-amber">
          {profile.code}
        </h1>
        <div className="min-w-0 basis-60 grow">
          <p className="truncate font-sans text-label font-semibold">{profile.name}</p>
          <p className="truncate font-sans text-data text-secondary">{details.join(' · ')}</p>
        </div>
      </div>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-price font-semibold">
          {last === undefined ? (
            <span className="text-secondary">{DASH}</span>
          ) : (
            <>
              <span className="sr-only">{t('etfProfile.price')} </span>
              <span className={quote?.isDelayed ? 'text-warning' : undefined}>
                {labels.price(last, currency)}
              </span>
            </>
          )}
        </span>
        {changePct !== undefined && (
          <span title={t('etfProfile.change')}>
            <ChangeText
              value={changePct}
              percent
              showIcon
              className="font-mono text-label font-semibold"
            />
          </span>
        )}
        {quote?.isDelayed && <Badge tone="warning">{t('security.delayed')}</Badge>}
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
