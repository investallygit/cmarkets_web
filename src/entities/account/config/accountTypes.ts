import { ACCOUNT_TYPES, type AccountType } from '@/shared/api/contracts'

/**
 * Each type's colour, reused across screen 9 (spec section 9): it carries identity only, from the
 * chart palette in its fixed order; the employees stay grey.
 */
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  student: 'var(--chart-1)',
  analyst: 'var(--chart-4)',
  manager: 'var(--chart-3)',
  trader: 'var(--chart-7)',
  dataAdmin: 'var(--text-secondary)',
  admin: 'var(--text-secondary)',
}

/** CMarket employees: created by an Admin only, with mandatory two-factor (spec section 12). */
export const EMPLOYEE_TYPES: readonly AccountType[] = ['dataAdmin', 'admin']

export const isEmployeeType = (type: AccountType) => EMPLOYEE_TYPES.includes(type)

export const isAccountType = (value: unknown): value is AccountType =>
  ACCOUNT_TYPES.some((type) => type === value)

/** The types an account can change to: a client stays a client, an employee an employee. */
export function typesFor(type: AccountType): readonly AccountType[] {
  return ACCOUNT_TYPES.filter((candidate) => isEmployeeType(candidate) === isEmployeeType(type))
}
