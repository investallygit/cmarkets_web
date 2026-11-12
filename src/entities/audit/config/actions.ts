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
  { label: 'audit.groups.statuses', actions: ['status-approve', 'status-reject'] },
  {
    label: 'audit.groups.moderation',
    actions: [
      'publication-approve',
      'publication-keep',
      'publication-takedown',
      'report-dismiss',
      'conversation-read',
    ],
  },
  {
    label: 'audit.groups.settings',
    actions: [
      'settings-update',
      'permissions-update',
      'specialty-add',
      'specialty-rename',
      'specialty-remove',
      'payout-paid',
    ],
  },
  {
    label: 'audit.groups.data',
    actions: [
      'import-publish',
      'import-rollback',
      'import-discard',
      'price-correct',
      'security-describe',
    ],
  },
  {
    label: 'audit.groups.content',
    actions: ['news-publish', 'news-edit', 'document-publish', 'document-edit'],
  },
  {
    label: 'audit.groups.payments',
    actions: [
      'news-statement-status',
      'news-statement-request',
      'news-statement-recalculate',
      'news-dispute-resolve',
      'news-anomaly-decide',
      'news-payment-terms',
      'news-payment-settings-update',
    ],
  },
]

export const isAuditAction = (value: unknown): value is AuditAction =>
  AUDIT_ACTIONS.some((action) => action === value)
