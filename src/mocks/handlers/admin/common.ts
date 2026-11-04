import type { AccountType, AdminReasonDto, Permission } from '@/shared/api/contracts'
import { currentAccount, currentUser } from '../../db'
import type { StoredAccount } from '../../fixtures/accounts'
import { problem } from '../../lib/http'

/**
 * What the Admin's routes share: the permission check and the problems they answer, and the
 * reason and decision the audit log keeps of a change.
 */

export type Errors = Record<string, string[]>

export const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
export const forbidden = () => problem(403, 'Forbidden', 'The administration is for the Admin.')
export const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)
export const notFound = (what: string, id: unknown) =>
  problem(404, `${what} not found`, `No ${what.toLowerCase()} ${String(id)}.`)
export const pick = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  values.find((candidate) => candidate === value)

const MIN_REASON = 5
const MAX_REASON = 500

export const TYPE_NAMES: Record<AccountType, string> = {
  student: 'Student',
  analyst: 'Analyst',
  manager: 'Portfolio manager',
  trader: 'Trader',
  journalist: 'Journalist',
  ceo: 'CEO',
  dataAdmin: 'Data admin',
  admin: 'Admin',
}

/** A reason the log keeps: suspension, reactivation, rejection, takedown. */
export async function readReason(request: Request): Promise<string | Errors> {
  const body = (await request.json()) as Partial<AdminReasonDto>
  const reason = String(body.reason ?? '').trim()
  return reason.length < MIN_REASON || reason.length > MAX_REASON
    ? { reason: [`Say why, in ${MIN_REASON} to ${MAX_REASON} characters: the log keeps it.`] }
    : reason
}

export const userTarget = (account: StoredAccount) =>
  ({ type: 'user', id: account.id, label: account.displayName }) as const

export function decision(reason: string | null = null) {
  return { at: new Date().toISOString(), by: currentAccount().displayName, reason }
}
