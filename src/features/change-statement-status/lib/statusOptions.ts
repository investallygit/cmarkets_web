import {
  STATEMENT_STATUSES,
  type NewsStatementDto,
  type StatementStatus,
} from '@/shared/api/contracts'

/**
 * The statuses a statement may be given by hand (spec, screen 18, "Manual status change"): all but
 * its own; Computed stays, since it runs the calculation again.
 */
export function statusChoices(current: StatementStatus): StatementStatus[] {
  return STATEMENT_STATUSES.filter((status) => status !== current || status === 'computed')
}

/** Paid takes the payment's date, method and reference. */
export const needsPayment = (status: StatementStatus | '') => status === 'paid'

/** Before its approval a statement may be computed again from its clicks, its status kept. */
export function canRecalculate(statement: Pick<NewsStatementDto, 'status' | 'previousStatus'>) {
  const status = statement.status === 'onHold' ? statement.previousStatus : statement.status
  return status === 'computed' || status === 'underReview' || status === 'toApprove'
}
