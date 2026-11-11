import { useTranslation } from 'react-i18next'
import type { StatementStatus } from '@/shared/api/contracts'
import { Badge } from '@/shared/ui/Badge'
import { STATEMENT_TONES } from '../config/statuses'

/** A statement's status in its colour: UNDER REVIEW, TO APPROVE, PAID… */
export function StatementStatusBadge({ status }: { status: StatementStatus }) {
  const { t } = useTranslation()
  return <Badge tone={STATEMENT_TONES[status]}>{t(`mediaPayments.statuses.${status}`)}</Badge>
}
