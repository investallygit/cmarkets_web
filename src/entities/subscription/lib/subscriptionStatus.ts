import type { PaymentLineStatus, SubscriptionListStatus } from '@/shared/api/contracts'

/**
 * SUBS's status colours (spec, screen 14): Active green, Expiring soon yellow, Payment failed and
 * Expired red; a suspension amber, a trial blue.
 */
export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionListStatus, string> = {
  active: 'text-up',
  expiringSoon: 'text-warning',
  paymentFailed: 'text-down',
  suspended: 'text-accent-amber',
  trial: 'text-info',
  expired: 'text-down',
}

/** The expiry date in yellow, as the mockup writes it, when the plan ends soon or has ended. */
export const expiryWarns = (status: SubscriptionListStatus) =>
  status === 'expiringSoon' || status === 'paymentFailed' || status === 'expired'

/** A line of the payments: paid green, failed then paid yellow, failed red. */
export const PAYMENT_LINE_COLORS: Record<PaymentLineStatus, string> = {
  paid: 'text-up',
  failedThenPaid: 'text-warning',
  failed: 'text-down',
  pending: 'text-secondary',
  due: 'text-warning',
  void: 'text-secondary',
}
