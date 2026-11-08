import type {
  AccountCountsDto,
  AccountListStatus,
  AccountType,
  AdminConversationDto,
  AdminPayoutDto,
  AdminSpecialtyDto,
  AdminUserCreateDto,
  AdminUserDetailsDto,
  AdminUserDto,
  AnalystRequestDto,
  AuditAction,
  AuditEntryDto,
  DirectorySettingsDto,
  DirectorySettingsUpdateDto,
  LibraryPublicationDto,
  ModerationItemDto,
  Paged,
  PayoutStatus,
  PlatformSettingsDto,
  PlatformSettingsUpdateDto,
  ReportedItemDto,
  ReportedItemType,
  RolePermissionsDto,
  SignUpDocument,
  SpecialtyInputDto,
  VerificationStatus,
} from '../contracts'
import { answer, route, send, sendBlob } from './define'

/** GET /admin/users: search, filters, sorting and page. */
export interface AccountQuery {
  q?: string
  type?: AccountType
  status?: AccountListStatus
  /** A column of the list, "-" first for a descending order: "-lastLoginAt". */
  sort?: string
  page?: number
  pageSize?: number
}

/** GET /admin/audit-log?userId=&action=&from=&to= */
export interface AuditQuery {
  /** Who acted, or the account acted on. */
  userId?: string
  /** One action, or several. */
  action?: AuditAction | readonly AuditAction[]
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

/** GET /admin/payouts?month=&status=&analystId= */
export interface PayoutQuery {
  /** YYYY-MM */
  month?: string
  status?: PayoutStatus
  analystId?: string
}

/**
 * CMarket.Api/Controllers/Admin: the Admin's back-office (screen 9, spec section 12): accounts,
 * status requests, moderation of the publications and of the directory, platform settings and
 * permissions, payouts, the audit log.
 */
export const adminRoutes = {
  users: route('GET', '/admin/users', answer<Paged<AdminUserDto>>()),
  userCounts: route('GET', '/admin/users/counts', answer<AccountCountsDto>()),
  exportUsers: route('GET', '/admin/users/export', answer<Blob>()),
  createUser: route('POST', '/admin/users', answer<AdminUserDetailsDto>()),
  user: route('GET', '/admin/users/{id}', answer<AdminUserDetailsDto>()),
  changeType: route('PUT', '/admin/users/{id}/type', answer<AdminUserDetailsDto>()),
  suspend: route('POST', '/admin/users/{id}/suspend', answer<AdminUserDetailsDto>()),
  reactivate: route('POST', '/admin/users/{id}/reactivate', answer<AdminUserDetailsDto>()),
  resetMfa: route('POST', '/admin/users/{id}/reset-mfa', answer<AdminUserDetailsDto>()),
  organizations: route('GET', '/admin/organizations', answer<{ id: string; name: string }[]>()),
  analystRequests: route('GET', '/admin/analyst-requests', answer<AnalystRequestDto[]>()),
  analystDocument: route('GET', '/admin/analyst-requests/{id}/documents/{kind}', answer<Blob>()),
  approveAnalyst: route(
    'POST',
    '/admin/analyst-requests/{id}/approve',
    answer<AnalystRequestDto>(),
  ),
  rejectAnalyst: route('POST', '/admin/analyst-requests/{id}/reject', answer<AnalystRequestDto>()),
  moderationQueue: route('GET', '/admin/publications', answer<ModerationItemDto[]>()),
  moderatedPublication: route('GET', '/admin/publications/{id}', answer<LibraryPublicationDto>()),
  approvePublication: route('POST', '/admin/publications/{id}/approve'),
  takeDownPublication: route('POST', '/admin/publications/{id}/takedown'),
  reports: route('GET', '/admin/reports', answer<ReportedItemDto[]>()),
  dismissReports: route('POST', '/admin/reports/{type}/{id}/dismiss'),
  reportedConversation: route('GET', '/admin/conversations/{id}', answer<AdminConversationDto>()),
  settings: route('GET', '/admin/settings', answer<PlatformSettingsDto>()),
  saveSettings: route('PUT', '/admin/settings', answer<PlatformSettingsDto>()),
  rolePermissions: route('GET', '/admin/roles/{role}/permissions', answer<RolePermissionsDto>()),
  saveRolePermissions: route(
    'PUT',
    '/admin/roles/{role}/permissions',
    answer<RolePermissionsDto>(),
  ),
  directorySettings: route('GET', '/admin/settings/directory', answer<DirectorySettingsDto>()),
  saveDirectorySettings: route('PUT', '/admin/settings/directory', answer<DirectorySettingsDto>()),
  specialties: route('GET', '/admin/specialties', answer<AdminSpecialtyDto[]>()),
  addSpecialty: route('POST', '/admin/specialties', answer<AdminSpecialtyDto>()),
  renameSpecialty: route('PUT', '/admin/specialties/{id}', answer<AdminSpecialtyDto>()),
  removeSpecialty: route('DELETE', '/admin/specialties/{id}'),
  payouts: route('GET', '/admin/payouts', answer<AdminPayoutDto[]>()),
  markPayoutPaid: route('POST', '/admin/payouts/{id}/mark-paid', answer<AdminPayoutDto>()),
  auditLog: route('GET', '/admin/audit-log', answer<Paged<AuditEntryDto>>()),
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const adminApi = {
  /** A page of the accounts. */
  users: (query: AccountQuery, signal?: AbortSignal) =>
    send(adminRoutes.users, { query: { ...query }, signal }),
  /** The active accounts by type. */
  userCounts: (signal?: AbortSignal) => send(adminRoutes.userCounts, { signal }),
  /** Every account of the filters as CSV, not only the page shown. */
  exportUsers: (query: Omit<AccountQuery, 'page' | 'pageSize'>) =>
    sendBlob(adminRoutes.exportUsers, { query: { ...query } }),
  /** Data admin and Admin accounts included. */
  createUser: (account: AdminUserCreateDto) => send(adminRoutes.createUser, { body: account }),
  /** Type, subscription, logins, purchases, publications. */
  user: (id: string, signal?: AbortSignal) => send(adminRoutes.user, of(id, signal)),
  changeType: (id: string, accountType: AccountType) =>
    send(adminRoutes.changeType, { params: { id }, body: { accountType } }),
  /** With the reason the log keeps. */
  suspend: (id: string, suspend: boolean, reason: string) =>
    send(suspend ? adminRoutes.suspend : adminRoutes.reactivate, {
      params: { id },
      body: { reason },
    }),
  /** Codes by e-mail again, every session ended. */
  resetMfa: (id: string) => send(adminRoutes.resetMfa, { params: { id } }),
  /** Those an account can be put in. */
  organizations: (signal?: AbortSignal) => send(adminRoutes.organizations, { signal }),
  /** The requests of Analysts, Journalists and CEOs, newest first. */
  analystRequests: (status: VerificationStatus, signal?: AbortSignal) =>
    send(adminRoutes.analystRequests, { query: { status }, signal }),
  /** A supporting document, as a PDF. */
  analystDocument: (id: string, kind: SignUpDocument, signal?: AbortSignal) =>
    sendBlob(adminRoutes.analystDocument, { params: { id, kind }, signal }),
  approveAnalyst: (id: string) => send(adminRoutes.approveAnalyst, { params: { id } }),
  /** With the reason the user is told. */
  rejectAnalyst: (id: string, reason: string) =>
    send(adminRoutes.rejectAnalyst, { params: { id }, body: { reason } }),
  /** The reports first, then those waiting; `kind` keeps one of the two. */
  moderationQueue: (kind: ModerationItemDto['kind'] | null, signal?: AbortSignal) =>
    send(adminRoutes.moderationQueue, { query: { status: kind }, signal }),
  /** The whole text as readers see it, or will once approved. */
  moderatedPublication: (id: string, signal?: AbortSignal) =>
    send(adminRoutes.moderatedPublication, of(id, signal)),
  /** One waiting goes live, a reported one stays. */
  approvePublication: (id: string) => send(adminRoutes.approvePublication, { params: { id } }),
  /** With the reason the analyst reads. */
  takeDownPublication: (id: string, reason: string) =>
    send(adminRoutes.takeDownPublication, { params: { id }, body: { reason } }),
  /** The profiles and conversations reported, the referred accounts first. */
  reports: (signal?: AbortSignal) => send(adminRoutes.reports, { signal }),
  /** Nothing breaks the rules. */
  dismissReports: (type: ReportedItemType, id: string) =>
    send(adminRoutes.dismissReports, { params: { type, id } }),
  /** Each reading is written to the audit log. */
  reportedConversation: (id: string, signal?: AbortSignal) =>
    send(adminRoutes.reportedConversation, of(id, signal)),
  /** Quotas, research pricing and moderation, risk-free rate. */
  settings: (signal?: AbortSignal) => send(adminRoutes.settings, { signal }),
  saveSettings: (settings: PlatformSettingsUpdateDto) =>
    send(adminRoutes.saveSettings, { body: settings }),
  rolePermissions: (role: AccountType, signal?: AbortSignal) =>
    send(adminRoutes.rolePermissions, { params: { role }, signal }),
  saveRolePermissions: ({ role, permissions }: RolePermissionsDto) =>
    send(adminRoutes.saveRolePermissions, { params: { role }, body: { role, permissions } }),
  /** Default contact rules, daily limits, report threshold. */
  directorySettings: (signal?: AbortSignal) => send(adminRoutes.directorySettings, { signal }),
  saveDirectorySettings: (settings: DirectorySettingsUpdateDto) =>
    send(adminRoutes.saveDirectorySettings, { body: settings }),
  /** The closed list and the profiles listing each. */
  specialties: (signal?: AbortSignal) => send(adminRoutes.specialties, { signal }),
  addSpecialty: (input: SpecialtyInputDto) => send(adminRoutes.addSpecialty, { body: input }),
  /** The names in French and English. */
  renameSpecialty: (id: string, input: SpecialtyInputDto) =>
    send(adminRoutes.renameSpecialty, { params: { id }, body: input }),
  /** One that no profile lists. */
  removeSpecialty: (id: string) => send(adminRoutes.removeSpecialty, { params: { id } }),
  /** Every analyst's monthly statements, newest month first. */
  payouts: (query: PayoutQuery, signal?: AbortSignal) =>
    send(adminRoutes.payouts, { query: { ...query }, signal }),
  /** The transfer to the analyst was made. */
  markPayoutPaid: (id: string) => send(adminRoutes.markPayoutPaid, { params: { id } }),
  /** The log, newest first, page by page. */
  auditLog: ({ action, ...query }: AuditQuery, signal?: AbortSignal) =>
    send(adminRoutes.auditLog, {
      query: { ...query, action: typeof action === 'string' ? action : action?.join(',') },
      signal,
    }),
}
