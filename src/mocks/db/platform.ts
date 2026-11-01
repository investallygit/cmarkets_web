import {
  ACCOUNT_TYPES,
  type AccountType,
  type AuditEntryDto,
  type MeDto,
  type Permission,
  type PlatformSettingsDto,
  type PublicationRulesDto,
  type RolePermissionsDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import type { StoredAccount } from '../fixtures/accounts'
import { createAdminAudit, createSettings } from '../fixtures/admin'
import { ROLE_PERMISSIONS } from '../fixtures/users'
import { isExpired } from '../lib/billing'
import { newId } from '../lib/ids'
import { modulesOf, organizationStore, subscriptionOf } from './accounts'
import { currentAccount } from './session'
import { sharedStore, sharedValue } from './storage'

/**
 * What the Admin sets for the whole platform: settings and the permissions of each account type;
 * the audit log of every action; and the user as GET /me returns them.
 */

/** Quotas, research pricing and moderation, risk-free rate: what the Admin sets in ADMCFG. */
export const settingsStore = sharedValue<PlatformSettingsDto>('platformSettings', createSettings)

/** The role -> permission table of spec section 12, which the Admin edits. */
export const roleStore = sharedStore<RolePermissionsDto[]>('rolePermissions', () =>
  ACCOUNT_TYPES.map((role) => ({ role, permissions: [...ROLE_PERMISSIONS[role]] })),
)

export function permissionsOf(accountType: AccountType): Permission[] {
  return roleStore.read().find((entry) => entry.role === accountType)?.permissions ?? []
}

/** GET /publications/rules: the Admin's price range, commission and moderation mode. */
export function publicationRules(): PublicationRulesDto {
  const { minPrice, maxPrice, commissionPct, moderation } = settingsStore.read()
  return { currency: 'XAF', minPrice, maxPrice, commissionPct, moderation }
}

/**
 * Every action of a Data admin or an Admin, who, what, when, before and after (spec section 12),
 * newest last.
 */
export const auditStore = sharedStore<AuditEntryDto[]>('auditLog', createAdminAudit)

export type AuditActor = AuditEntryDto['actor']

export const actorOf = ({ id, displayName, accountType }: StoredAccount): AuditActor => ({
  id,
  displayName,
  accountType,
})

/** Writes an entry of the audit log, by the user of the request unless another is given. */
export function recordAudit(
  action: AuditEntryDto['action'],
  target: AuditEntryDto['target'],
  {
    changes = [],
    reason = null,
    at = new Date().toISOString(),
    actor,
  }: Partial<Pick<AuditEntryDto, 'changes' | 'reason' | 'at' | 'actor'>> = {},
): AuditEntryDto {
  const entry: AuditEntryDto = {
    id: newId('audit'),
    at,
    actor: actor ?? actorOf(currentAccount()),
    action,
    target,
    changes,
    reason,
  }
  auditStore.write([...auditStore.read(), entry])
  return entry
}

export function currentUser(): MeDto {
  const account = currentAccount()
  const organization = organizationStore
    .read()
    .find((candidate) => candidate.id === account.organizationId)
  const subscription = subscriptionOf(account)
  const today = toMarketDay(Date.now())
  const { id, displayName, email, accountType, language, timeZone, phone } = account
  return {
    id,
    displayName,
    email,
    accountType,
    organization: organization ? { id: organization.id, name: organization.name } : null,
    language,
    timeZone,
    phone,
    twoFactorChannel: account.twoFactorChannel,
    permissions: permissionsOf(accountType),
    quotas: { ...settingsStore.read().quotas[accountType] },
    analystStatus: accountType === 'analyst' ? account.analystStatus : null,
    modules: modulesOf(account),
    trialEndsAt:
      subscription?.status === 'trial' && !isExpired(subscription, today)
        ? subscription.periodEnd
        : null,
  }
}
