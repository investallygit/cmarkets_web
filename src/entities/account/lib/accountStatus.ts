import type { AccountListStatus, AdminUserDto } from '@/shared/api/contracts'

/** Active, under review (an Analyst waiting for approval) or suspended. */
export function accountListStatus(
  account: Pick<AdminUserDto, 'status' | 'analystStatus'>,
): AccountListStatus {
  if (account.status === 'suspended') return 'suspended'
  return account.analystStatus === 'pending' ? 'review' : 'active'
}
