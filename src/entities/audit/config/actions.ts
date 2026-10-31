import { AUDIT_ACTIONS, type AuditAction } from '@/shared/api/contracts'
import type { TranslationKey } from '@/shared/i18n'

/** The actions of the filter, by area. */
export const AUDIT_ACTION_GROUPS: readonly {
  label: TranslationKey
  actions: readonly AuditAction[]
}[] = [
  {
    label: 'audit.groups.accounts',
    actions: ['user-create', 'user-type', 'user-suspend', 'user-reactivate', 'user-reset-mfa'],
  },
  { label: 'audit.groups.analysts', actions: ['analyst-approve', 'analyst-reject'] },
  {
    label: 'audit.groups.moderation',
    actions: ['publication-approve', 'publication-keep', 'publication-takedown'],
  },
  {
    label: 'audit.groups.settings',
    actions: ['settings-update', 'permissions-update', 'payout-paid'],
  },
  {
    label: 'audit.groups.data',
    actions: ['import-publish', 'import-rollback', 'import-discard', 'price-correct'],
  },
  {
    label: 'audit.groups.content',
    actions: ['news-publish', 'news-edit', 'document-publish', 'document-edit'],
  },
]

export const isAuditAction = (value: unknown): value is AuditAction =>
  AUDIT_ACTIONS.some((action) => action === value)
