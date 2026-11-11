import type { StatementStatus } from '@/shared/api/contracts'
import type { BadgeTone } from '@/shared/ui/Badge'

/**
 * The colour of a statement's status, as the screen 18 mockup draws its cycle: computed grey,
 * under review yellow, to approve blue, approved and paid green, disputed red, on hold neutral.
 */
export const STATEMENT_TONES: Record<StatementStatus, BadgeTone> = {
  computed: 'neutral',
  underReview: 'warning',
  toApprove: 'info',
  approved: 'up',
  paid: 'up',
  disputed: 'down',
  onHold: 'neutral',
}

/** The cycle of the mockup's legend, in its order. */
export const STATEMENT_CYCLE: readonly StatementStatus[] = [
  'computed',
  'underReview',
  'toApprove',
  'approved',
  'paid',
  'disputed',
]

/** The text colour of a status in a table. */
export const STATEMENT_TEXT: Record<StatementStatus, string> = {
  computed: 'text-secondary',
  underReview: 'text-warning',
  toApprove: 'text-info',
  approved: 'text-up',
  paid: 'text-up',
  disputed: 'text-down',
  onHold: 'text-primary',
}
