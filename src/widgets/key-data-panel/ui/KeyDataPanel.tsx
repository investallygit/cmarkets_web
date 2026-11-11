import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { priceDecimals } from '@/entities/quote'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'

type Row = [label: string, value: ReactNode]

const MISSING = '—'

/** "2026-07-08" -> "07/2026". */
const monthYear = (date: string) => `${date.slice(5, 7)}/${date.slice(0, 4)}`

function KeyValues({ rows }: { rows: readonly Row[] }) {
  return (
    <dl>
      {rows.map(([label, value], index) => (
        <div
          key={label}
          className={
            index % 2 === 1
              ? 'flex h-row items-center gap-3 bg-row-alt px-2'
              : 'flex h-row items-center gap-3 px-2'
          }
        >
          <dt className="truncate font-sans text-data text-secondary">{label}</dt>
          <dd className="ml-auto truncate font-mono text-data">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Screen 2, key data: an equity's reference figures (a bond's terms are its profile's
 * characteristics, screen 20). API /securities/{id}.
 */
export function KeyDataPanel({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const decimals = priceDecimals(profile.type, profile.currency)
  const nextEvent = profile.nextEvent
    ? `${profile.nextEvent.title} · ${format.isoDate(profile.nextEvent.date)}`
    : MISSING

  const equityRows: Row[] = [
    [t('keyData.isin'), profile.isin],
    [t('keyData.sector'), profile.sector],
    [
      t('keyData.shares'),
      profile.sharesOutstanding === null ? MISSING : format.number(profile.sharesOutstanding, 0),
    ],
    [
      t('keyData.freeFloat'),
      profile.freeFloatPct === null ? MISSING : format.percent(profile.freeFloatPct, 1, false),
    ],
    [
      t('keyData.range52w'),
      `${format.number(profile.high52w, decimals)} / ${format.number(profile.low52w, decimals)}`,
    ],
    [
      t('keyData.beta', { index: profile.betaIndex }),
      profile.beta1y === null ? t('keyData.insufficientData') : format.number(profile.beta1y, 2),
    ],
    [
      t('keyData.lastDividend'),
      profile.lastDividend
        ? `${profile.currency} ${format.number(profile.lastDividend.amount, 0)} (${monthYear(profile.lastDividend.paymentDate)})`
        : MISSING,
    ],
    [t('keyData.nextEvent'), nextEvent],
  ]

  return (
    <Panel title={t('panels.keyData')} code="DES">
      <KeyValues rows={equityRows} />
    </Panel>
  )
}
