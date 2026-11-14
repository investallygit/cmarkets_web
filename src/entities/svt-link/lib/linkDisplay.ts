import type { SvtLinkStatus } from '@/shared/api/contracts'
import { formatCompact, type Locale } from '@/shared/lib/format'
import type { BadgeTone } from '@/shared/ui/Badge'

/** A link's status as the mockups colour it: CONFIRMED green, PENDING yellow, WITHDRAWN red. */
export const LINK_TONES: Readonly<Record<SvtLinkStatus, BadgeTone>> = {
  pending: 'warning',
  confirmed: 'up',
  declined: 'down',
  expired: 'neutral',
  withdrawn: 'down',
}

/** In force: the trader may not ask the same SVT again meanwhile. */
export function isLinkInForce(status: SvtLinkStatus): boolean {
  return status === 'pending' || status === 'confirmed'
}

/**
 * A daily limit as screen 27 writes it: "1 Bn", "500 M", "1.5 Bn"; a decimal only when the amount
 * needs one.
 */
export function formatDailyLimit(amount: number, locale: Locale): string {
  const unit = amount >= 1e9 ? 1e9 : amount >= 1e6 ? 1e6 : 1e3
  return formatCompact(amount, locale, Number.isInteger(amount / unit) ? 0 : 1)
}
