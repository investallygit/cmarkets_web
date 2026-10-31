import { useTranslation } from 'react-i18next'
import type { PayoutStatus } from '@/shared/api/contracts'

const TONES: Record<PayoutStatus, string> = {
  accruing: 'text-secondary',
  due: 'text-warning',
  paid: 'text-up',
}

/** In progress (the current month), Due (closed, to pay), Paid. */
export function PayoutStatusText({ status }: { status: PayoutStatus }) {
  const { t } = useTranslation()
  return <span className={TONES[status]}>{t(`payouts.statuses.${status}`)}</span>
}
