import type { AccountListStatus, AdminUserDto } from '@/shared/api/contracts'

/** Active, under review (a status waiting for an Admin's approval) or suspended. */
export function accountListStatus(
  account: Pick<AdminUserDto, 'status' | 'verificationStatus'>,
): AccountListStatus {
  if (account.status === 'suspended') return 'suspended'
  return account.verificationStatus === 'pending' ? 'review' : 'active'
}
