import {
  ACCOUNT_TYPES,
  VERIFIED_ACCOUNT_TYPES,
  type AccountType,
  type VerifiedAccountType,
} from '@/shared/api/contracts'

// The colours are shared with the profiles of the directory (entities/profile).
export { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'

/** CMarket employees: created by an Admin only, with mandatory two-factor (spec section 12). */
export const EMPLOYEE_TYPES: readonly AccountType[] = ['dataAdmin', 'admin']

export const isEmployeeType = (type: AccountType) => EMPLOYEE_TYPES.includes(type)

export const isAccountType = (value: unknown): value is AccountType =>
  ACCOUNT_TYPES.some((type) => type === value)

/** Analyst, Journalist and CEO: an Admin approves the status, which brings the VERIFIED badge. */
export const isVerifiedType = (type: AccountType): type is VerifiedAccountType =>
  VERIFIED_ACCOUNT_TYPES.some((candidate) => candidate === type)

/**
 * The family of a type, which Change type keeps: a client stays a client, an SVT an SVT (a bank's
 * account, the fourth version's), an employee an employee, as CMarket.Api rules (B92: SVT was
 * offered to a client, then refused).
 */
const familyOf = (type: AccountType) =>
  isEmployeeType(type) ? 'employee' : type === 'svt' ? 'svt' : 'client'

/** The types an account can change to, within its family. */
export function typesFor(type: AccountType): readonly AccountType[] {
  return ACCOUNT_TYPES.filter((candidate) => familyOf(candidate) === familyOf(type))
}
