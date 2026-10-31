import { useTranslation } from 'react-i18next'
import type { AdminUserDto } from '@/shared/api/contracts'
import { accountListStatus } from '../lib/accountStatus'

const TONES = { active: 'text-up', review: 'text-warning', suspended: 'text-down' } as const

/** Active in green, Under review in yellow, Suspended in red (screen 9 mockup). */
export function AccountStatusText({
  account,
}: {
  account: Pick<AdminUserDto, 'status' | 'analystStatus'>
}) {
  const { t } = useTranslation()
  const status = accountListStatus(account)
  return <span className={TONES[status]}>{t(`accounts.statuses.${status}`)}</span>
}
