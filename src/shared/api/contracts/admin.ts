import type { SignUpDocument } from './auth'
import type { IsoDate, IsoDateTime } from './common'
import type {
  AccountType,
  ClientAccountType,
  OtpChannel,
  Permission,
  UserLanguage,
  VerificationStatus,
  VerifiedAccountType,
} from './me'
import type { ConversationKind, ConversationReportReason, MessageDto } from './messaging'
import type { OrganizationRole } from './organization'
import type { ContactRules, ProfileReportReason, SpecialtyDto } from './profiles'
import type {
  ContentReportReason,
  PayoutDto,
  PublicationStatus,
  PublicationSubjectDto,
} from './research'
import type { BillingCycle } from './subscription'

// Administration, under /admin and for the Admin only (spec sections 9, screen 9, and 10).

export type AccountStatus = 'active' | 'suspended'

/**
 * Filter of the accounts list: an Analyst, a Journalist or a CEO waiting for an Admin's approval
 * is under review.
 */
export const ACCOUNT_LIST_STATUSES = ['active', 'review', 'suspended'] as const
export type AccountListStatus = (typeof ACCOUNT_LIST_STATUSES)[number]

/** ?sort= of GET /admin/users, "-" first for a descending order. */
export const ADMIN_USER_SORTS = [
  'name',
  'email',
  'type',
  'organization',
  'status',
  'createdAt',
  'lastLoginAt',
] as const
export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number]

/** GET /admin/users?type=&status=&q=&sort=: one account of the list. */
export interface AdminUserDto {
  id: string
  displayName: string
  email: string
  accountType: AccountType
  organization: { id: string; name: string } | null
  status: AccountStatus
  verificationStatus: VerificationStatus | null
  createdAt: IsoDateTime
  lastLoginAt: IsoDateTime | null
}

/** GET /admin/users/counts: the active accounts by type, for the counters of screen 9. */
export type AccountCountsDto = Record<AccountType, number>

/** Who decided and when: the status of an Analyst, a Journalist or a CEO, a suspension. */
export interface AdminDecisionDto {
  at: IsoDateTime
  by: string
  reason: string | null
}

/** The plan that covers the account, its own or its organisation's. */
export interface AdminSubscriptionDto {
  planName: string
  status: 'trial' | 'active' | 'expired'
  billingCycle: BillingCycle | null
  /** First day after the period or the trial. */
  periodEnd: IsoDate
  paidBy: 'user' | 'organization'
}

/** GET /admin/users/{id}: type, subscription, logins, purchases, publications. */
export interface AdminUserDetailsDto extends AdminUserDto {
  phone: string | null
  language: UserLanguage
  timeZone: string
  organizationRole: OrganizationRole | null
  verificationDecision: AdminDecisionDto | null
  subscription: AdminSubscriptionDto | null
  /** Login codes go by e-mail or SMS; mandatory for employees (spec section 12). */
  twoFactor: { channel: OtpChannel; mandatory: boolean }
  /** The place comes from the address the login came from. */
  lastLogin: { at: IsoDateTime; place: string } | null
  /** Research bought by a client. */
  purchases: { count: number; amount: number } | null
  /** An Analyst's publications and sales. */
  publishing: {
    publications: number
    withdrawn: number
    sales: number
    revenue: number
  } | null
  /**
   * A client's reports: on their publications, their profile and their direct conversations;
   * referred to the Admin past the threshold of open ones (spec section 15).
   */
  reportsReceived: { total: number; open: number; referred: boolean } | null
  suspension: AdminDecisionDto | null
}

/**
 * POST /admin/users. Employee accounts (Data admin, Admin) belong to CMarket and log in with a
 * code every time; the user chooses a password from the invitation e-mail.
 */
export interface AdminUserCreateDto {
  displayName: string
  email: string
  accountType: AccountType
  organizationId: string | null
  phone: string | null
  language: UserLanguage
}

/** PUT /admin/users/{id}/type */
export interface AccountTypeChangeDto {
  accountType: AccountType
}

/** Suspend, reactivate, reject a request, take a publication down: the reason is logged. */
export interface AdminReasonDto {
  reason: string
}

/**
 * GET /admin/analyst-requests?status=: the sign-up of an Analyst, a Journalist or a CEO and its
 * supporting documents (the spec names the endpoint after the Analysts only).
 */
export interface AnalystRequestDto {
  /** The account's id. */
  id: string
  accountType: VerifiedAccountType
  displayName: string
  email: string
  organization: string | null
  requestedAt: IsoDateTime
  documents: { kind: SignUpDocument; fileName: string; size: number }[]
  status: VerificationStatus
  decision: AdminDecisionDto | null
}

export interface ModerationReportDto {
  id: string
  reason: ContentReportReason
  comment: string
  reportedAt: IsoDateTime
  reportedBy: string
}

/** GET /admin/publications?status=pending|reported: the moderation queue. */
export interface ModerationItemDto {
  publicationId: string
  kind: 'pending' | 'reported'
  title: string
  analyst: { id: string; displayName: string }
  subject: PublicationSubjectDto | null
  status: PublicationStatus
  /** When it was submitted, or the latest report. */
  since: IsoDateTime
  /** The analyst's first publication, reviewed before it goes live whatever the mode. */
  firstPublication: boolean
  /** The reports not dealt with yet, newest first. */
  reports: ModerationReportDto[]
}

/** What the reports of the directory and the messaging are about (spec section 15). */
export type ReportedItemType = 'profile' | 'conversation'

export interface AdminReportDto {
  id: string
  reason: ProfileReportReason | ConversationReportReason
  comment: string
  reportedAt: IsoDateTime
  reportedBy: { userId: string; displayName: string; accountType: AccountType }
}

/** The account reports are about: a profile's, or the other member of a direct conversation. */
export interface ReportedAccountDto {
  userId: string
  displayName: string
  accountType: AccountType
  status: AccountListStatus
  /** The open reports on its profile and its direct conversations. */
  openReports: number
  /** Past the Admin's threshold of open reports: referred to the Admin. */
  referred: boolean
}

/**
 * GET /admin/reports?type=profile|conversation: a profile or a conversation with the reports not
 * dealt with yet, the newest first; the prototype groups the reports by what they are about.
 */
export interface ReportedItemDto {
  type: ReportedItemType
  /** The profile's user id, or the conversation's id. */
  id: string
  /** The profile's name, the group's, or the members of a direct conversation. */
  title: string
  /** Null for a group, whose reports are about no one in particular. */
  account: ReportedAccountDto | null
  conversation: { kind: ConversationKind; memberCount: number } | null
  /** The latest report. */
  since: IsoDateTime
  reports: AdminReportDto[]
}

/** GET /admin/conversations/{id}: a reported conversation only, each reading logged. */
export interface AdminConversationDto {
  id: string
  kind: ConversationKind
  title: string
  createdAt: IsoDateTime
  members: { userId: string; displayName: string; accountType: AccountType; left: boolean }[]
  /** The oldest first, as their members see them; a deleted message stays deleted. */
  messages: MessageDto[]
}

export interface QuotaDto {
  portfolios: number | null
  alerts: number | null
}

/** GET / PUT /admin/settings: quotas, research pricing and moderation, risk-free rate, XAF curve. */
export interface PlatformSettingsDto {
  /** null means unlimited. */
  quotas: Record<AccountType, QuotaDto>
  /** XAF. */
  minPrice: number
  maxPrice: number
  commissionPct: number
  moderation: 'before' | 'after'
  /** R_f of the Sharpe ratio (spec section 14.3). */
  riskFreeRatePct: number
  /**
   * The CEMAC state whose sovereign curve the XAF bonds' spreads are read on (spec section 14.4,
   * "Reference curve per currency, set by the Admin"): "CM" by default.
   */
  xafReferenceCurve: string
  updatedAt: IsoDateTime | null
  updatedBy: string | null
}

export type PlatformSettingsUpdateDto = Omit<PlatformSettingsDto, 'updatedAt' | 'updatedBy'>

/**
 * GET / PUT /admin/settings/directory, the prototype's: what spec section 15 lets the Admin set,
 * without an endpoint in the spec.
 */
export interface DirectorySettingsDto {
  /** The rules of a profile whose owner never chose theirs. */
  defaultContactRules: ContactRules
  /** New conversations a client may open a day. */
  newConversationsPerDay: Record<ClientAccountType, number>
  /** An account is referred to the Admin beyond this many open reports. */
  reportThreshold: number
  updatedAt: IsoDateTime | null
  updatedBy: string | null
}

export type DirectorySettingsUpdateDto = Omit<DirectorySettingsDto, 'updatedAt' | 'updatedBy'>

/** GET /admin/specialties, the prototype's: the closed list, with the profiles listing each. */
export interface AdminSpecialtyDto extends SpecialtyDto {
  profiles: number
}

/** POST /admin/specialties · PUT /admin/specialties/{id}: the name in French and English. */
export interface SpecialtyInputDto {
  name: SpecialtyDto['name']
}

/** GET / PUT /admin/roles/{role}/permissions */
export interface RolePermissionsDto {
  role: AccountType
  permissions: Permission[]
}

/** GET /admin/payouts?month=&status=&analystId=: one analyst's month. */
export interface AdminPayoutDto extends PayoutDto {
  /** analystId:YYYY-MM */
  id: string
  analyst: { id: string; displayName: string }
  paidBy: string | null
}

/** What the audit log records (spec section 12): each action of a Data admin or an Admin. */
export const AUDIT_ACTIONS = [
  'user-create',
  'user-type',
  'user-suspend',
  'user-reactivate',
  'user-reset-mfa',
  'status-approve',
  'status-reject',
  'publication-approve',
  'publication-keep',
  'publication-takedown',
  'settings-update',
  'permissions-update',
  'payout-paid',
  'report-dismiss',
  'conversation-read',
  'specialty-add',
  'specialty-rename',
  'specialty-remove',
  'import-publish',
  'import-rollback',
  'import-discard',
  'price-correct',
  'news-publish',
  'news-edit',
  'document-publish',
  'document-edit',
  'news-approve',
  'news-keep',
  'news-takedown',
  'news-retype',
  'news-source-update',
  'news-settings-update',
  'publisher-save',
  'publisher-remove',
  'ingest-client-create',
  'ingest-client-revoke',
  'news-statement-status',
  'news-statement-request',
  'news-statement-recalculate',
  'news-dispute-resolve',
  'news-anomaly-decide',
  'news-payment-terms',
  'news-payment-settings-update',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type AuditTargetType =
  | 'user'
  | 'publication'
  | 'import'
  | 'price'
  | 'news'
  | 'document'
  | 'settings'
  | 'role'
  | 'payout'
  | 'profile'
  | 'conversation'
  | 'specialty'
  | 'newsSource'
  | 'publisher'
  | 'ingestClient'
  | 'newsStatement'
  | 'clickAnomaly'

/** What a change is about; `scope` says which account type, permission or security. */
export const AUDIT_FIELDS = [
  'accountType',
  'status',
  'verificationStatus',
  'twoFactorChannel',
  'organization',
  'portfolios',
  'alerts',
  'minPrice',
  'maxPrice',
  'commissionPct',
  'moderation',
  'riskFreeRatePct',
  'contactRule',
  'newConversations',
  'reportThreshold',
  'reports',
  'permission',
  'payout',
  'publicationStatus',
  'importStatus',
  'rows',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'title',
  'name',
  'newsStatus',
  'newsType',
  'shortName',
  'website',
  'language',
  'verified',
  'ratePerClick',
  'monthlyCap',
  'flashQuota',
  'logo',
  'confidenceThreshold',
  'viewsPerHour',
  'domain',
  'addresses',
  'hourlyQuota',
  'statementStatus',
  'amountDue',
  'decision',
  'effectiveFrom',
  'minimumPayment',
  'fourEyesThreshold',
  'disputeWindow',
  'calculationDay',
  'calculationTime',
  'spikeFactor',
  'sharedAddressAccounts',
  'xafReferenceCurve',
] as const
export type AuditField = (typeof AUDIT_FIELDS)[number]

export type AuditValue = string | number | boolean | null

export interface AuditChangeDto {
  field: AuditField
  /** The account type of a quota, the permission of a role. */
  scope: string | null
  before: AuditValue
  after: AuditValue
}

/** GET /admin/audit-log?userId=&action=&from=&to=: who, what, when, value before and after. */
export interface AuditEntryDto {
  id: string
  at: IsoDateTime
  actor: { id: string; displayName: string; accountType: AccountType }
  action: AuditAction
  target: { type: AuditTargetType; id: string; label: string }
  changes: AuditChangeDto[]
  reason: string | null
}
