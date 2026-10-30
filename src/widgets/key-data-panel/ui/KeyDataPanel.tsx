import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBond } from '@/entities/bond'
import { priceDecimals } from '@/entities/quote'
import type { BondDto, SecurityProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

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
 * Screen 2, key data: reference figures of an equity, or the terms of a bond.
 * API /securities/{id}, and /bonds/{id} for a bond.
 */
export function KeyDataPanel({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const isBond = profile.type === 'bond'
  const bond = useBond(profile.id, isBond)
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

  const bondRows = (terms: BondDto): Row[] => {
    const frequency =
      terms.frequency === 2
        ? t('keyData.frequencies.halfYearly')
        : terms.frequency === 4
          ? t('keyData.frequencies.quarterly')
          : t('keyData.frequencies.annual')
    return [
      [t('keyData.isin'), profile.isin],
      [t('keyData.issuer'), terms.issuer],
      [t('keyData.coupon'), `${format.percent(terms.couponPct, 2, false)} ${frequency}`],
      [t('keyData.issueDate'), format.isoDate(terms.issueDate)],
      [t('keyData.maturity'), format.isoDate(terms.maturityDate)],
      [
        t('keyData.amortization'),
        terms.amortization === 'bullet'
          ? t('keyData.amortizations.bullet')
          : t('keyData.amortizations.straight', {
              share: format.percent(100 / terms.schedule.length, 0, false),
            }),
      ],
      [t('keyData.dayCount'), terms.dayCount],
      [t('keyData.outstanding'), `${terms.currency} ${format.compact(terms.amountOutstanding)}`],
      [t('keyData.nextEvent'), nextEvent],
    ]
  }

  return (
    <Panel title={t(isBond ? 'panels.bondTerms' : 'panels.keyData')} code="DES">
      {isBond ? (
        <QueryView query={bond}>{(terms) => <KeyValues rows={bondRows(terms)} />}</QueryView>
      ) : (
        <KeyValues rows={equityRows} />
      )}
    </Panel>
  )
}
