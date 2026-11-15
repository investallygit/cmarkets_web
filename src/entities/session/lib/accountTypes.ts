import type { AccountType } from '@/shared/api/contracts'
import type { Audience } from '@/shared/routes/screens'

const AUDIENCE: Record<AccountType, Audience> = {
  student: 'client',
  analyst: 'client',
  manager: 'client',
  trader: 'client',
  journalist: 'client',
  ceo: 'client',
  newsProvider: 'client',
  // The SVT works in the terminal, on a menu of its own (ROADMAP decision 16).
  svt: 'client',
  dataAdmin: 'backoffice',
  admin: 'backoffice',
}

/** Data admin and Admin are CMarket employees who only use the back-office (spec section 12). */
export function audienceOf(accountType: AccountType): Audience {
  return AUDIENCE[accountType]
}

/**
 * Opens its modules through a plan or a trial (spec section 6): the clients. The SVT pays none
 * (ROADMAP decision 16): its permissions bound what it opens, and CFG shows it no plan to choose.
 */
export function hasPlan(accountType: AccountType): boolean {
  return audienceOf(accountType) === 'client' && accountType !== 'svt'
}

/** "Kevin Atangana" -> "K.", for the user badge of the top bar. */
export function initialOf(displayName: string): string {
  const first = displayName.trim().charAt(0)
  return first ? `${first.toUpperCase()}.` : ''
}
