import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSvtSummary } from '@/entities/rfq'
import { useFormat } from '@/shared/i18n'

/**
 * Screen 27's counters (spec section 9; API /svt/summary): the agreements to approve in amber, those
 * approved today in green and rejected today in red, the face approved today, the bank's linked
 * traders and the link requests waiting.
 */
export function SvtCounters() {
  const { t } = useTranslation()
  const format = useFormat()
  const summary = useSvtSummary()
  const data = summary.data
  const figure = (value: number | undefined) =>
    value === undefined ? '—' : format.number(value, 0)

  return (
    <div
      role="group"
      aria-label={t('svt.counters.label')}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
    >
      <Counter label={t('svt.counters.toApprove')} tone="text-accent-amber">
        {figure(data?.toApprove)}
      </Counter>
      <Counter label={t('svt.counters.approvedToday')} tone="text-up">
        {figure(data?.approvedToday)}
      </Counter>
      <Counter label={t('svt.counters.rejectedToday')} tone="text-down">
        {figure(data?.rejectedToday)}
      </Counter>
      <Counter label={t('svt.counters.amountApproved')}>
        {data
          ? t('svt.counters.amount', {
              amount:
                data.amountApprovedToday > 0
                  ? format.compact(data.amountApprovedToday)
                  : format.number(0, 0),
            })
          : '—'}
      </Counter>
      <Counter label={t('svt.counters.linkedTraders')}>{figure(data?.linkedTraders)}</Counter>
      <Counter label={t('svt.counters.linkRequests')} tone="text-accent-amber">
        {figure(data?.linkRequests)}
      </Counter>
    </div>
  )
}

/** A counter wraps rather than cut its words: two to a row on a phone, the amount stays whole. */
function Counter({ label, tone, children }: { label: string; tone?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border bg-panel px-3 py-1.5">
      <span className="font-sans text-title font-semibold tracking-title text-secondary uppercase">
        {label}
      </span>
      <span className={clsx('font-mono text-figure font-semibold', tone)}>{children}</span>
    </div>
  )
}
