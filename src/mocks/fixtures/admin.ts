import type {
  AuditEntryDto,
  ContentReportReason,
  PlatformSettingsDto,
} from '@/shared/api/contracts'
import { PUBLICATION_RULES } from './research'
import { DEMO_USERS, ROLE_QUOTAS } from './users'

/** L. Mvogo, the demo Admin, who made the Admin's changes of the log. */
export const ADMIN_ACTOR: AuditEntryDto['actor'] = {
  id: DEMO_USERS.admin.id,
  displayName: DEMO_USERS.admin.displayName,
  accountType: 'admin',
}

/** Admin settings of spec sections 12 to 14; the maximum price was raised on 6 October. */
export function createSettings(): PlatformSettingsDto {
  const { minPrice, maxPrice, commissionPct, moderation } = PUBLICATION_RULES
  return {
    quotas: structuredClone(ROLE_QUOTAS),
    minPrice,
    maxPrice,
    commissionPct,
    moderation,
    // The screen 5 mockup shows 5.0% under the Sharpe ratio.
    riskFreeRatePct: 5,
    updatedAt: '2026-10-06T08:12:00Z',
    updatedBy: ADMIN_ACTOR.displayName,
  }
}

/** A reader's report; the moderators keep the publication or take it down. */
export interface StoredReport {
  id: string
  publicationId: string
  userId: string
  reason: ContentReportReason
  comment: string
  reportedAt: string
  status: 'open' | 'closed'
  closedAt: string | null
  closedBy: string | null
  outcome: 'kept' | 'takenDown' | null
}

const open = { status: 'open', closedAt: null, closedBy: null, outcome: null } as const

/** The two reports of the screen 9 mockup, and the closed one on K. Atangana's account. */
// prettier-ignore
export const REPORT_FIXTURES: StoredReport[] = [
  { id: 'report-gabon-oil', publicationId: 'pub-gabon-oil', userId: 'user-ella', reason: 'misleading', comment: 'Unsourced figures on the oil revenue.', reportedAt: '2026-10-29T13:05:00Z', ...open },
  { id: 'report-safacam-rubber', publicationId: 'pub-safacam-rubber', userId: 'user-ngono', reason: 'conflict', comment: 'The author advises a competitor of SAFACAM.', reportedAt: '2026-10-28T09:40:00Z', ...open },
  { id: 'report-bange-margins', publicationId: 'pub-bange-margins', userId: 'user-fouda', reason: 'other', comment: 'Valuation far too optimistic.', reportedAt: '2026-10-20T16:10:00Z',
    status: 'closed', closedAt: '2026-10-21T08:30:00Z', closedBy: ADMIN_ACTOR.displayName, outcome: 'kept' },
]

/** The Admin's past actions; the Data admins' come with the uploads they seed. */
// prettier-ignore
export function createAdminAudit(): AuditEntryDto[] {
  const entry = (
    id: string,
    at: string,
    action: AuditEntryDto['action'],
    target: AuditEntryDto['target'],
    changes: AuditEntryDto['changes'],
    reason: string | null = null,
  ): AuditEntryDto => ({ id: `audit-seed-${id}`, at, actor: ADMIN_ACTOR, action, target, changes, reason })
  const user = (id: string, label: string) => ({ type: 'user', id, label }) as const
  return [
    entry('ekane', '2026-01-12T08:00:00Z', 'user-create', user('user-ekane', 'J. Ekane'), [
      { field: 'accountType', scope: null, before: null, after: 'dataAdmin' },
    ]),
    entry('payout-sept', '2026-10-05T09:00:00Z', 'payout-paid', { type: 'payout', id: 'analyst-atangana:2026-09', label: 'K. Atangana, 2026-09' }, [
      { field: 'payout', scope: null, before: 'due', after: 'paid' },
    ]),
    entry('max-price', '2026-10-06T08:12:00Z', 'settings-update', { type: 'settings', id: 'platform', label: 'Platform settings' }, [
      { field: 'maxPrice', scope: null, before: 50_000, after: 100_000 },
    ], 'Long country reports sell above XAF 50,000.'),
    entry('mba', '2026-10-12T10:20:00Z', 'user-suspend', user('user-mba', 'F. Mba'), [
      { field: 'status', scope: null, before: 'active', after: 'suspended' },
    ], 'Login shared outside Bank C, reported by its administrator.'),
    entry('nguema', '2026-10-19T10:00:00Z', 'status-approve', user('user-nguema', 'C. Nguema'), [
      { field: 'verificationStatus', scope: 'analyst', before: 'pending', after: 'approved' },
    ]),
    entry('bange', '2026-10-21T08:30:00Z', 'publication-keep', { type: 'publication', id: 'pub-bange-margins', label: 'BANGE: margins under pressure, attractive valuation' }, [],
      'A rating is the analyst\'s opinion; the figures are sourced.'),
    entry('owona', '2026-10-23T14:45:00Z', 'user-reset-mfa', user('user-manager', 'P. Owona'), [
      { field: 'twoFactorChannel', scope: null, before: 'sms', after: 'email' },
    ], 'New phone: codes by e-mail until the new number is set.'),
  ]
}
