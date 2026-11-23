import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useIndexProfile } from '@/entities/market'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { PanelError } from '@/shared/ui/StatusViews'

interface Figure {
  label: string
  value: ReactNode
}

/**
 * Screen 31 header (spec section 9, fifth version): the code, the name, "price index ·
 * cap-weighted · 7 constituents · XAF · fixing"; the close at 26 px with its date and its change;
 * the previous value, YTD, one year, the 52-week high and low, the constituents' capitalisation.
 * API GET /indices/{code}.
 */
export function IndexProfileHeader({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const profile = useIndexProfile(code)
  if (profile.isError)
    return <PanelError error={profile.error} onRetry={() => void profile.refetch()} />
  const data = profile.data
  const missing = '—'
  const value = (figure: number | null | undefined) =>
    figure === null || figure === undefined ? missing : format.number(figure, 2)
  const pct = (figure: number | null | undefined) =>
    figure === null || figure === undefined ? (
      missing
    ) : (
      <ChangeText value={figure} percent decimals={1} />
    )
  const figures: Figure[] = data
    ? [
        { label: t('indexProfile.header.previous'), value: value(data.previousValue) },
        { label: t('indexProfile.header.ytd'), value: pct(data.ytdPct) },
        { label: t('indexProfile.header.oneYear'), value: pct(data.oneYearPct) },
        { label: t('indexProfile.header.high52'), value: value(data.high52Weeks) },
        { label: t('indexProfile.header.low52'), value: value(data.low52Weeks) },
        {
          label: t('indexProfile.header.marketCap'),
          value: t('indexProfile.billions', { value: format.number(data.marketCapBn, 1) }),
        },
      ]
    : []
  const details = data
    ? [
        t(`indexProfile.kinds.${data.kind}`),
        t('indexProfile.header.capWeighted'),
        t('indexProfile.header.constituents', { count: data.constituentCount }),
        data.currency,
        t('indexProfile.header.fixing'),
      ]
    : []

  return (
    <section
      aria-label={data?.name ?? code}
      aria-busy={profile.isPending || undefined}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-4">
          <h1 className="font-mono text-figure font-semibold text-accent-amber">{code}</h1>
          <span className="truncate font-sans text-label font-semibold">{data?.name}</span>
        </div>
        <p className="truncate font-sans text-data text-secondary">{details.join(' · ')}</p>
      </div>
      {data && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="flex flex-col">
            <span className="font-mono text-price font-semibold">
              {format.number(data.value, 2)}
            </span>
            <span className="font-sans text-caption text-secondary">
              {t('indexProfile.header.closeOf', { date: format.isoDate(data.closeDate) })}
            </span>
          </span>
          <span className="flex items-baseline gap-3 font-mono text-label font-semibold">
            <ChangeText value={data.change} decimals={2} showIcon />
            <ChangeText value={data.changePct} percent />
          </span>
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
