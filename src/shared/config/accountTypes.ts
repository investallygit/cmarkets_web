import type { AccountType } from '@/shared/api/contracts'

/**
 * Each type's colour, that of its badge in the directory (spec section 9, screen 10), reused
 * wherever a type shows, screen 9 included; the employees stay grey.
 */
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  student: 'var(--type-student)',
  analyst: 'var(--type-analyst)',
  manager: 'var(--type-manager)',
  trader: 'var(--type-trader)',
  journalist: 'var(--type-journalist)',
  ceo: 'var(--type-ceo)',
  newsProvider: 'var(--type-news-provider)',
  dataAdmin: 'var(--text-secondary)',
  admin: 'var(--text-secondary)',
}
