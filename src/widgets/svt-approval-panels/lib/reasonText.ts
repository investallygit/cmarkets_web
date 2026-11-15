import type { TFunction } from 'i18next'
import type { ApprovalDecisionDto } from '@/shared/api/contracts'

/**
 * A rejection's reason as both traders read it: the reason with its comment, "other" by its text
 * alone ("Securities not available (at the seller)", "Settlement account under review").
 */
export function reasonText(
  t: TFunction,
  decision: Pick<ApprovalDecisionDto, 'reason' | 'comment'>,
): string {
  if (!decision.reason) return ''
  if (decision.reason === 'other') return decision.comment ?? t('svt.reasons.other')
  const label = t(`svt.reasons.${decision.reason}`)
  return decision.comment ? `${label} (${decision.comment})` : label
}
