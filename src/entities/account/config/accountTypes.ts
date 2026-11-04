import {
  ACCOUNT_TYPES,
  VERIFIED_ACCOUNT_TYPES,
  type AccountType,
  type VerifiedAccountType,
} from '@/shared/api/contracts'

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
  dataAdmin: 'var(--text-secondary)',
  admin: 'var(--text-secondary)',
}

/** CMarket employees: created by an Admin only, with mandatory two-factor (spec section 12). */
export const EMPLOYEE_TYPES: readonly AccountType[] = ['dataAdmin', 'admin']

export const isEmployeeType = (type: AccountType) => EMPLOYEE_TYPES.includes(type)

export const isAccountType = (value: unknown): value is AccountType =>
  ACCOUNT_TYPES.some((type) => type === value)

/** Analyst, Journalist and CEO: an Admin approves the status, which brings the VERIFIED badge. */
export const isVerifiedType = (type: AccountType): type is VerifiedAccountType =>
  VERIFIED_ACCOUNT_TYPES.some((candidate) => candidate === type)

/** The types an account can change to: a client stays a client, an employee an employee. */
export function typesFor(type: AccountType): readonly AccountType[] {
  return ACCOUNT_TYPES.filter((candidate) => isEmployeeType(candidate) === isEmployeeType(type))
}
