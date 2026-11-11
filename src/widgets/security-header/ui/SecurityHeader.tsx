import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LiveChange,
  LiveChangePct,
  LivePrice,
  LiveVolume,
  priceDecimals,
  useQuote,
} from '@/entities/quote'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'

interface Figure {
  label: string
  value: ReactNode
}

/**
 * Screen 2 header: code, name, last price at 26 px and change in real time, then 7 key figures
 * (spec section 9). A bond's profile has its own (screen 20, BondProfileHeader).
 */
export function SecurityHeader({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const quote = useQuote(profile.id).data
  const decimals = priceDecimals(profile.type, profile.currency)
  const missing = '—'
  const price = (value: number | undefined) =>
    value === undefined ? missing : format.number(value, decimals)

  const figures: Figure[] = [
    { label: t('security.figures.open'), value: price(quote?.open) },
    { label: t('security.figures.high'), value: price(quote?.high) },
    { label: t('security.figures.low'), value: price(quote?.low) },
    {
      label: t('security.figures.volume'),
      value: quote ? <LiveVolume symbol={profile.id} value={quote.volume} /> : missing,
    },
    {
      label: t('security.figures.marketCap'),
      value: quote ? format.compact(quote.marketCap) : missing,
    },
    {
      label: t('security.figures.pe'),
      value: profile.pe === null ? missing : `${format.number(profile.pe, 1)}x`,
    },
    {
      label: t('security.figures.yield'),
      value: profile.yieldPct === null ? missing : format.percent(profile.yieldPct, 1, false),
    },
  ]
  const details = [
    t(`security.types.${profile.type}`),
    profile.exchange,
    format.country(profile.country),
    profile.sector,
    profile.currency,
  ]

  return (
    <section
      aria-label={profile.name}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-4">
          <h1 className="font-mono text-figure font-semibold text-accent-amber">{profile.code}</h1>
          <span className="truncate font-sans text-label font-semibold">{profile.name}</span>
        </div>
        <p className="truncate font-sans text-data text-secondary">{details.join(' · ')}</p>
      </div>
      {quote && (
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-price font-semibold">
            <LivePrice
              symbol={profile.id}
              value={quote.last}
              decimals={decimals}
              isDelayed={quote.isDelayed}
            />
          </span>
          <span className="flex items-baseline gap-3 font-mono text-label font-semibold">
            <LiveChange symbol={profile.id} value={quote.change} decimals={decimals} />
            <LiveChangePct symbol={profile.id} value={quote.changePct} />
          </span>
          {quote.isDelayed && <Badge tone="warning">{t('security.delayed')}</Badge>}
        </div>
      )}
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
