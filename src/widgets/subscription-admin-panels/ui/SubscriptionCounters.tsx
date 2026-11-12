import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscriptionStats } from '@/entities/subscription'
import type { SubscriptionListStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

interface SubscriptionCountersProps {
  /** The status the list is filtered on; a click on its counter clears it. */
  status: SubscriptionListStatus | null
  onStatus: (status: SubscriptionListStatus | null) => void
}

/**
 * Screen 14, counters (GET /admin/subscriptions/stats): active subscriptions, those expiring within
 * 30 days in yellow, the expired not renewed and the failed payments of 30 days in red, the
 * amount collected this month in green. The yellow and red ones filter the list on their status.
 */
export function SubscriptionCounters({ status, onStatus }: SubscriptionCountersProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const stats = useSubscriptionStats()
  const figure = (value: number | undefined) =>
    value === undefined ? '—' : format.number(value, 0)
  const toggle = (value: SubscriptionListStatus) => onStatus(status === value ? null : value)

  return (
    <div
      role="group"
      aria-label={t('subscriptionAdmin.counters')}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"
    >
      <Counter label={t('subscriptionAdmin.active')}>{figure(stats.data?.active)}</Counter>
      <Counter
        label={t('subscriptionAdmin.expiringSoon')}
        tone="text-warning"
        pressed={status === 'expiringSoon'}
        onClick={() => toggle('expiringSoon')}
      >
        {figure(stats.data?.expiringSoon)}
      </Counter>
      <Counter
        label={t('subscriptionAdmin.expiredNotRenewed')}
        tone="text-down"
        pressed={status === 'expired'}
        onClick={() => toggle('expired')}
      >
        {figure(stats.data?.expiredNotRenewed)}
      </Counter>
      <Counter
        label={t('subscriptionAdmin.failedPayments')}
        tone="text-down"
        pressed={status === 'paymentFailed'}
        onClick={() => toggle('paymentFailed')}
      >
        {figure(stats.data?.failedPayments)}
      </Counter>
      <Counter label={t('subscriptionAdmin.collected')} tone="text-up">
        {stats.data
          ? t('subscriptionAdmin.collectedAmount', {
              amount: format.compact(stats.data.collectedThisMonth),
              currency: stats.data.currency,
            })
          : '—'}
      </Counter>
    </div>
  )
}

interface CounterProps {
  label: string
  tone?: string
  /** A counter that filters the list: a toggle button. */
  pressed?: boolean
  onClick?: () => void
  children: ReactNode
}

function Counter({ label, tone, pressed, onClick, children }: CounterProps) {
  const className = clsx(
    'flex min-w-0 flex-col gap-0.5 border px-3 py-1.5 text-left',
    pressed ? 'bg-selected' : 'bg-panel',
    onClick && 'hover:bg-panel-header',
  )
  const content = (
    <>
      <span className="truncate font-sans text-title font-semibold tracking-title text-secondary uppercase">
        {label}
      </span>
      <span className={clsx('truncate font-mono text-figure font-semibold', tone)}>{children}</span>
    </>
  )
  return onClick ? (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}
