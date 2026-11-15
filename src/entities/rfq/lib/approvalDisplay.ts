import type { ClientCheckDto, RfqRejectionReason, SvtApprovalStatus } from '@/shared/api/contracts'
import type { BadgeTone } from '@/shared/ui/Badge'

/** An approval's status as screen 27 colours it: pending yellow, approved green, rejected red. */
export const APPROVAL_TONES: Readonly<Record<SvtApprovalStatus, BadgeTone>> = {
  pending: 'warning',
  approved: 'up',
  rejected: 'down',
  expired: 'neutral',
}

/** The reasons offered, in the spec's order (screen 27). */
export const REJECTION_REASONS: readonly RfqRejectionReason[] = [
  'clientLimitExceeded',
  'securitiesNotAvailable',
  'fundsNotAvailable',
  'unknownClientOrBlockedAccount',
  'offMarketPrice',
  'other',
]

/** The text "other" needs, and any comment: 500 characters at most (CMarket.Api). */
export const COMMENT_MAX_LENGTH = 500

/**
 * The checks' result as the list writes it: "OK"; "Limit" when the face exceeds a client's daily
 * limit; "Link" when a client's link is no longer confirmed. Flagged, the decision stays the SVT's.
 */
export type CheckResult = 'ok' | 'limit' | 'link'

export function checkResult(clients: readonly ClientCheckDto[]): CheckResult {
  if (clients.some((client) => !client.linkConfirmed)) return 'link'
  return clients.some((client) => client.overLimit) ? 'limit' : 'ok'
}

/** What is left of a client's daily limit after today's agreements; null without a limit. */
export function limitLeft(client: ClientCheckDto): number | null {
  return client.dailyLimit === null ? null : client.dailyLimit - client.usedToday
}

/** The milliseconds left to decide before `deadline`; zero once past. */
export function timeLeft(deadline: string, now: number): number {
  return Math.max(0, Date.parse(deadline) - now)
}
