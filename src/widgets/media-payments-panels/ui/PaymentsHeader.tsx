import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { monthsUpTo, previousMonth, useStatementsSummary } from '@/entities/news-statement'
import { useFormat } from '@/shared/i18n'
import { Select } from '@/shared/ui/form/Select'

interface PaymentsHeaderProps {
  month: string
  onMonthChange: (month: string) => void
}

/**
 * MPAY's header over the workspace (the screen 18 mockup): the month, then its total amount due, payable unique
 * clicks, excluded clicks, anomalies still open and the amount already paid.
 */
export function PaymentsHeader({ month, onMonthChange }: PaymentsHeaderProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const summary = useStatementsSummary(month)
  // The statements of a month come on the calculation day of the next: the last is last month's.
  const months = monthsUpTo(previousMonth(format.day(new Date())), 12)
  const figures = summary.data
  const amount = (value: number | undefined) =>
    value === undefined ? '—' : `XAF ${format.number(value, 0)}`

  return (
    <section
      aria-label={t('screens.MPAY.title')}
      className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 xl:grid-cols-6"
    >
      <Tile label={t('mediaPayments.header.month')} highlight>
        <Select
          aria-label={t('mediaPayments.header.month')}
          value={month}
          options={months.map((value) => ({ value, label: format.month(value) }))}
          onChange={onMonthChange}
          highlight
          className="panel-no-drag w-full"
        />
      </Tile>
      <Tile label={t('mediaPayments.header.amountDue')}>{amount(figures?.amountDue)}</Tile>
      <Tile label={t('mediaPayments.header.payable')}>
        {figures ? format.number(figures.payableClicks, 0) : '—'}
      </Tile>
      <Tile label={t('mediaPayments.header.excluded')} tone="text-accent-amber">
        {figures ? format.number(figures.excludedClicks, 0) : '—'}
      </Tile>
      <Tile
        label={t('mediaPayments.header.openAnomalies')}
        tone={figures && figures.openAnomalies > 0 ? 'text-down' : undefined}
      >
        {figures ? format.number(figures.openAnomalies, 0) : '—'}
      </Tile>
      <Tile label={t('mediaPayments.header.paid')} tone="text-up">
        {amount(figures?.amountPaid)}
      </Tile>
    </section>
  )
}

function Tile({
  label,
  tone,
  highlight = false,
  children,
}: {
  label: string
  tone?: string | undefined
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'flex min-w-0 flex-col justify-center gap-1 bg-panel px-3 py-2',
        highlight && 'outline outline-1 -outline-offset-1 outline-accent-amber',
      )}
    >
      <span className="font-sans text-caption font-semibold uppercase tracking-title text-secondary">
        {label}
      </span>
      <span
        className={clsx('truncate font-mono text-figure font-semibold', tone ?? 'text-primary')}
      >
        {children}
      </span>
    </div>
  )
}
