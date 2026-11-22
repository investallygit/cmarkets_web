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
import { useSectorName } from '@/entities/market'
import { tradesAtFixing } from '@/entities/security'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'

interface Figure {
  label: string
  value: ReactNode
}

/**
 * Screen 2 header (spec section 9, fifth version): code, name, type and "fixing auction" for a
 * BVMAC security, the last fixing at 26 px with its date and its change from the previous fixing in
 * real time, then the previous price, the volume, the value traded, the market cap, the P/E and the
 * yield. A European or US security says its close and shows the session's open, high and low. A
 * bond's and an ETF's profiles have their own (screens 20 and 19).
 */
export function SecurityHeader({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const sectorName = useSectorName()
  const quote = useQuote(profile.id).data
  const decimals = priceDecimals(profile.type, profile.currency)
  const missing = '—'
  const price = (value: number | undefined) =>
    value === undefined ? missing : format.number(value, decimals)

  const fixing = tradesAtFixing(profile)
  const session: Figure[] = fixing
    ? [{ label: t('security.figures.previous'), value: price(quote?.previousClose) }]
    : [
        { label: t('security.figures.open'), value: price(quote?.open) },
        { label: t('security.figures.high'), value: price(quote?.high) },
        { label: t('security.figures.low'), value: price(quote?.low) },
      ]
  const figures: Figure[] = [
    ...session,
    {
      label: t('security.figures.volume'),
      value: quote ? <LiveVolume symbol={profile.id} value={quote.volume} /> : missing,
    },
    ...(fixing
      ? [
          {
            label: t('security.figures.valueTraded'),
            value: quote ? format.compact(quote.value) : missing,
          },
        ]
      : []),
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
    sectorName(profile.sector),
    profile.currency,
    ...(fixing ? [t('security.fixingAuction')] : []),
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
      {/* The price, its change and the delay wrap rather than cut the badge (B27). */}
      {quote && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="flex flex-col">
            <span className="font-mono text-price font-semibold">
              <LivePrice
                symbol={profile.id}
                value={quote.last}
                decimals={decimals}
                isDelayed={quote.isDelayed}
              />
            </span>
            <span className="font-sans text-caption text-secondary">
              {fixing
                ? t('security.fixingOf', { date: format.date(quote.fixingDate) })
                : t('security.closeOf', { date: format.date(quote.fixingDate) })}
            </span>
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
