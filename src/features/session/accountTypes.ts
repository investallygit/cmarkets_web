import type { AccountType } from '@/shared/api/contracts'

export type Audience = 'client' | 'backoffice'

const AUDIENCE: Record<AccountType, Audience> = {
  student: 'client',
  analyst: 'client',
  manager: 'client',
  trader: 'client',
  dataAdmin: 'backoffice',
  admin: 'backoffice',
}

/** Data admin and Admin are CMarket employees who only use the back-office (spec section 12). */
export function audienceOf(accountType: AccountType): Audience {
  return AUDIENCE[accountType]
}

/** "Kevin Atangana" -> "K.", for the user badge of the top bar. */
export function initialOf(displayName: string): string {
  const first = displayName.trim().charAt(0)
  return first ? `${first.toUpperCase()}.` : ''
}
