import type {
  AccountCountsDto,
  AccountListStatus,
  AccountType,
  AdminConversationDto,
  AdminNewsSourceDetailsDto,
  AdminNewsSourceDto,
  AdminNewsSourceWriteDto,
  AdminPayoutDto,
  AdminPlanDto,
  AdminSpecialtyDto,
  AdminSubscriptionDetailsDto,
  AdminSubscriptionQuery,
  AdminSubscriptionRowDto,
  AdminUserCreateDto,
  AdminUserDetailsDto,
  AdminUserDto,
  AnomalyClickDto,
  AnomalyDecisionWriteDto,
  AnalystRequestDto,
  AuditAction,
  AuditEntryDto,
  ClickAnomalyDto,
  DirectorySettingsDto,
  DirectorySettingsUpdateDto,
  DisputeResolutionWriteDto,
  IngestClientCreatedDto,
  IngestClientDto,
  IngestClientWriteDto,
  InvoiceDto,
  InvoiceSentDto,
  LibraryPublicationDto,
  ModeratedNewsDto,
  ModerationItemDto,
  NewsChannel,
  NewsPaymentSettingsDto,
  NewsPaymentSettingsWriteDto,
  NewsQueueItemDto,
  NewsQueueKind,
  NewsSettingsDto,
  NewsSettingsWriteDto,
  NewsStatementDto,
  NewsStatementRowDto,
  NewsStatementsSummaryDto,
  NewsType,
  Paged,
  PayoutStatus,
  PlanChangeProrationDto,
  PlatformSettingsDto,
  PlatformSettingsUpdateDto,
  PublisherDto,
  PublisherWriteDto,
  ReportedItemDto,
  ReportedItemType,
  RolePermissionsDto,
  SignUpDocument,
  SourcePaymentSettingsDto,
  SourcePaymentSettingsSavedDto,
  SourcePaymentSettingsWriteDto,
  SourcePaymentTermsDto,
  SpecialtyInputDto,
  StatementDisputeDto,
  StatementHistoryEntryDto,
  StatementItemDto,
  StatementStatus,
  StatementStatusWriteDto,
  SubscriptionExtendDto,
  SubscriptionPaymentDto,
  SubscriptionPlanWriteDto,
  SubscriptionStatsDto,
  VerificationStatus,
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

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

/** GET /admin/news?status=&channel=&sourceId=: the moderation queue's filters. */
export interface NewsQueueQuery {
  kind?: NewsQueueKind | null
  channel?: NewsChannel | null
  sourceId?: string | null
}

/** GET /admin/payouts?month=&status=&analystId= */
export interface PayoutQuery {
  /** YYYY-MM */
  month?: string
  status?: PayoutStatus
  analystId?: string
}

/** The order of a statement's items: the most clicked first, by headline, the latest published first. */
export type StatementItemsSort = 'clicks' | 'headline' | 'published'

/**
 * CMarket.Api/Controllers/Admin: the Admin's back-office (screen 9, spec section 12): accounts,
 * status requests, moderation of the publications and of the directory, platform settings and
 * permissions, payouts, the audit log; the news moderation of NEWS and MOD, the publishers' domains
 * and SRC's newspapers, AI settings and ingestion clients (ROADMAP step 27); MPAY's statements,
 * click anomalies and payment settings (step 28); SUBS's subscriptions, their payments and invoices
 * (step 34).
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
  newsQueue: route('GET', '/admin/news', answer<NewsQueueItemDto[]>()),
  moderatedNews: route('GET', '/admin/news/{id}', answer<ModeratedNewsDto>()),
  approveNews: route('POST', '/admin/news/{id}/approve', answer<ModeratedNewsDto>()),
  takeDownNews: route('POST', '/admin/news/{id}/takedown', answer<ModeratedNewsDto>()),
  retypeNews: route('POST', '/admin/news/{id}/retype', answer<ModeratedNewsDto>()),
  publishers: route('GET', '/admin/publishers', answer<PublisherDto[]>()),
  savePublisher: route('PUT', '/admin/publishers', answer<PublisherDto>()),
  removePublisher: route('DELETE', '/admin/publishers/{id}'),
  newsSources: route('GET', '/admin/news-sources', answer<AdminNewsSourceDto[]>()),
  newsSource: route('GET', '/admin/news-sources/{id}', answer<AdminNewsSourceDetailsDto>()),
  saveNewsSource: route('PUT', '/admin/news-sources/{id}', answer<AdminNewsSourceDetailsDto>()),
  uploadNewsSourceLogo: route(
    'PUT',
    '/admin/news-sources/{id}/logo',
    answer<AdminNewsSourceDetailsDto>(),
  ),
  removeNewsSourceLogo: route(
    'DELETE',
    '/admin/news-sources/{id}/logo',
    answer<AdminNewsSourceDetailsDto>(),
  ),
  newsSettings: route('GET', '/admin/news-settings', answer<NewsSettingsDto>()),
  saveNewsSettings: route('PUT', '/admin/news-settings', answer<NewsSettingsDto>()),
  ingestClients: route('GET', '/admin/ingest-clients', answer<IngestClientDto[]>()),
  createIngestClient: route('POST', '/admin/ingest-clients', answer<IngestClientCreatedDto>()),
  revokeIngestClient: route('DELETE', '/admin/ingest-clients/{id}'),
  statements: route('GET', '/admin/news-statements', answer<NewsStatementRowDto[]>()),
  statementsSummary: route(
    'GET',
    '/admin/news-statements/summary',
    answer<NewsStatementsSummaryDto>(),
  ),
  transferFile: route('GET', '/admin/news-statements/transfer-file', answer<Blob>()),
  statement: route('GET', '/admin/news-statements/{id}', answer<NewsStatementDto>()),
  statementItems: route('GET', '/admin/news-statements/{id}/items', answer<StatementItemDto[]>()),
  statementHistory: route(
    'GET',
    '/admin/news-statements/{id}/history',
    answer<StatementHistoryEntryDto[]>(),
  ),
  statementPdf: route('GET', '/admin/news-statements/{id}/pdf', answer<Blob>()),
  changeStatementStatus: route(
    'PUT',
    '/admin/news-statements/{id}/status',
    answer<NewsStatementDto>(),
  ),
  confirmStatementRequest: route(
    'POST',
    '/admin/news-statements/{id}/status-requests/{requestId}/confirm',
    answer<NewsStatementDto>(),
  ),
  cancelStatementRequest: route(
    'POST',
    '/admin/news-statements/{id}/status-requests/{requestId}/cancel',
    answer<NewsStatementDto>(),
  ),
  recalculateStatement: route(
    'POST',
    '/admin/news-statements/{id}/recalculate',
    answer<NewsStatementDto>(),
  ),
  approveStatement: route(
    'POST',
    '/admin/news-statements/{id}/approve',
    answer<NewsStatementDto>(),
  ),
  holdStatement: route('POST', '/admin/news-statements/{id}/hold', answer<NewsStatementDto>()),
  releaseStatement: route(
    'POST',
    '/admin/news-statements/{id}/release',
    answer<NewsStatementDto>(),
  ),
  markStatementPaid: route(
    'POST',
    '/admin/news-statements/{id}/mark-paid',
    answer<NewsStatementDto>(),
  ),
  statementDisputes: route(
    'GET',
    '/admin/news-statements/{id}/disputes',
    answer<StatementDisputeDto[]>(),
  ),
  resolveStatementDispute: route(
    'POST',
    '/admin/news-statements/{id}/disputes/{disputeId}/resolve',
    answer<NewsStatementDto>(),
  ),
  clickAnomalies: route('GET', '/admin/news-clicks/anomalies', answer<ClickAnomalyDto[]>()),
  anomalyClicks: route(
    'GET',
    '/admin/news-clicks/anomalies/{id}/clicks',
    answer<AnomalyClickDto[]>(),
  ),
  decideAnomaly: route(
    'POST',
    '/admin/news-clicks/anomalies/{id}/decision',
    answer<ClickAnomalyDto>(),
  ),
  paymentTerms: route(
    'GET',
    '/admin/news-sources/{id}/payment-settings',
    answer<SourcePaymentTermsDto>(),
  ),
  savePaymentTerms: route(
    'PUT',
    '/admin/news-sources/{id}/payment-settings',
    answer<SourcePaymentSettingsSavedDto>(),
  ),
  paymentTermsHistory: route(
    'GET',
    '/admin/news-sources/{id}/payment-settings/history',
    answer<SourcePaymentSettingsDto[]>(),
  ),
  paymentSettings: route('GET', '/admin/news-payment-settings', answer<NewsPaymentSettingsDto>()),
  savePaymentSettings: route(
    'PUT',
    '/admin/news-payment-settings',
    answer<NewsPaymentSettingsDto>(),
  ),
  subscriptions: route('GET', '/admin/subscriptions', answer<Paged<AdminSubscriptionRowDto>>()),
  subscriptionStats: route('GET', '/admin/subscriptions/stats', answer<SubscriptionStatsDto>()),
  subscriptionPlans: route('GET', '/admin/subscriptions/plans', answer<AdminPlanDto[]>()),
  exportSubscriptions: route('GET', '/admin/subscriptions/export', answer<Blob>()),
  subscription: route(
    'GET',
    '/admin/subscriptions/{accountId}',
    answer<AdminSubscriptionDetailsDto>(),
  ),
  subscriptionPayments: route(
    'GET',
    '/admin/subscriptions/{accountId}/payments',
    answer<SubscriptionPaymentDto[]>(),
  ),
  subscriptionInvoices: route(
    'GET',
    '/admin/subscriptions/{accountId}/invoices',
    answer<InvoiceDto[]>(),
  ),
  planChangeProration: route(
    'GET',
    '/admin/subscriptions/{accountId}/proration',
    answer<PlanChangeProrationDto>(),
  ),
  changeSubscriptionPlan: route(
    'PUT',
    '/admin/subscriptions/{accountId}/plan',
    answer<AdminSubscriptionDetailsDto>(),
  ),
  extendSubscription: route(
    'POST',
    '/admin/subscriptions/{accountId}/extend',
    answer<AdminSubscriptionDetailsDto>(),
  ),
  suspendSubscription: route(
    'POST',
    '/admin/subscriptions/{accountId}/suspend',
    answer<AdminSubscriptionDetailsDto>(),
  ),
  reactivateSubscription: route(
    'POST',
    '/admin/subscriptions/{accountId}/reactivate',
    answer<AdminSubscriptionDetailsDto>(),
  ),
  invoicePdf: route('GET', '/admin/invoices/{id}/pdf', answer<Blob>()),
  resendInvoice: route('POST', '/admin/invoices/{id}/resend', answer<InvoiceSentDto>()),
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
  /** The reported news items first, then those waiting, newest first. */
  newsQueue: ({ kind, channel, sourceId }: NewsQueueQuery, signal?: AbortSignal) =>
    send(adminRoutes.newsQueue, { query: { status: kind, channel, sourceId }, signal }),
  /** The item as readers see it, or will once approved, with its reports. */
  moderatedNews: (id: string, signal?: AbortSignal) =>
    send(adminRoutes.moderatedNews, of(id, signal)),
  /** One waiting goes live (or waits for its time); a reported one stays, its reports closed. */
  approveNews: (id: string) => send(adminRoutes.approveNews, { params: { id } }),
  /** Out of the feed, with the reason its newspaper reads. */
  takeDownNews: (id: string, reason: string) =>
    send(adminRoutes.takeDownNews, { params: { id }, body: { reason } }),
  /** ARTICLE to FLASH, or back. */
  retypeNews: (id: string, type: NewsType) =>
    send(adminRoutes.retypeNews, { params: { id }, body: { type } }),
  /** The domains the Data admin named, by domain. */
  publishers: (signal?: AbortSignal) => send(adminRoutes.publishers, { signal }),
  /** A domain named, or renamed: its newspapers take the names. */
  savePublisher: (publisher: PublisherWriteDto) =>
    send(adminRoutes.savePublisher, { body: publisher }),
  removePublisher: (id: string) => send(adminRoutes.removePublisher, { params: { id } }),
  /** The newspapers of a channel, or all, the partner newspapers first. */
  newsSources: (channel: NewsChannel | null, signal?: AbortSignal) =>
    send(adminRoutes.newsSources, { query: { channel }, signal }),
  newsSource: (id: string, signal?: AbortSignal) => send(adminRoutes.newsSource, of(id, signal)),
  /** Its description, verification and moderation; a partner newspaper's contract. */
  saveNewsSource: (id: string, source: AdminNewsSourceWriteDto) =>
    send(adminRoutes.saveNewsSource, { params: { id }, body: source }),
  /** A PNG, JPEG or WebP image of 512 KB at most. */
  uploadNewsSourceLogo: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return sendForm(adminRoutes.uploadNewsSourceLogo, form, { params: { id } })
  },
  removeNewsSourceLogo: (id: string) => send(adminRoutes.removeNewsSourceLogo, { params: { id } }),
  /** The AI's moderation and confidence threshold, the views an hour. */
  newsSettings: (signal?: AbortSignal) => send(adminRoutes.newsSettings, { signal }),
  saveNewsSettings: (settings: NewsSettingsWriteDto) =>
    send(adminRoutes.saveNewsSettings, { body: settings }),
  /** The servers allowed to push news, never their secrets. */
  ingestClients: (signal?: AbortSignal) => send(adminRoutes.ingestClients, { signal }),
  /** A new client and its signing secret, shown this once. */
  createIngestClient: (client: IngestClientWriteDto) =>
    send(adminRoutes.createIngestClient, { body: client }),
  revokeIngestClient: (id: string) => send(adminRoutes.revokeIngestClient, { params: { id } }),
  /** A month's statements ("2026-10"), one per newspaper, the largest amount due first. */
  statements: (month: string, status: StatementStatus | null, signal?: AbortSignal) =>
    send(adminRoutes.statements, { query: { month, status }, signal }),
  statementsSummary: (month: string, signal?: AbortSignal) =>
    send(adminRoutes.statementsSummary, { query: { month }, signal }),
  /** The month's approved, unpaid statements: newspaper, amount, reference. */
  transferFile: (month: string, format: 'xlsx' | 'csv') =>
    sendBlob(adminRoutes.transferFile, { query: { month, format } }),
  statement: (id: string, signal?: AbortSignal) => send(adminRoutes.statement, of(id, signal)),
  statementItems: (id: string, sort: StatementItemsSort, signal?: AbortSignal) =>
    send(adminRoutes.statementItems, { params: { id }, query: { sort }, signal }),
  statementHistory: (id: string, signal?: AbortSignal) =>
    send(adminRoutes.statementHistory, of(id, signal)),
  statementPdf: (id: string) => sendBlob(adminRoutes.statementPdf, { params: { id } }),
  /** A status and its reason; 409 statementSecondAdmin when a second Admin must confirm it. */
  changeStatementStatus: (id: string, change: StatementStatusWriteDto) =>
    send(adminRoutes.changeStatementStatus, { params: { id }, body: change }),
  /** Another Admin confirms the change waiting. */
  confirmStatementRequest: (id: string, requestId: string) =>
    send(adminRoutes.confirmStatementRequest, { params: { id, requestId } }),
  cancelStatementRequest: (id: string, requestId: string) =>
    send(adminRoutes.cancelStatementRequest, { params: { id, requestId } }),
  recalculateStatement: (id: string) => send(adminRoutes.recalculateStatement, { params: { id } }),
  releaseStatement: (id: string, reason: string | null) =>
    send(adminRoutes.releaseStatement, { params: { id }, body: { reason } }),
  statementDisputes: (id: string, signal?: AbortSignal) =>
    send(adminRoutes.statementDisputes, of(id, signal)),
  /** The amount maintained, or the statement corrected. */
  resolveStatementDispute: (id: string, disputeId: string, resolution: DisputeResolutionWriteDto) =>
    send(adminRoutes.resolveStatementDispute, { params: { id, disputeId }, body: resolution }),
  /** A month's click anomalies of a newspaper. */
  clickAnomalies: (month: string, sourceId: string, signal?: AbortSignal) =>
    send(adminRoutes.clickAnomalies, { query: { month, sourceId }, signal }),
  anomalyClicks: (id: string, signal?: AbortSignal) =>
    send(adminRoutes.anomalyClicks, of(id, signal)),
  /** The clicks invalidated or kept, with a reason; the statement computed again. */
  decideAnomaly: (id: string, decision: AnomalyDecisionWriteDto) =>
    send(adminRoutes.decideAnomaly, { params: { id }, body: decision }),
  paymentTerms: (sourceId: string, signal?: AbortSignal) =>
    send(adminRoutes.paymentTerms, of(sourceId, signal)),
  /** A new version from a month on; the statements not approved yet are computed again. */
  savePaymentTerms: (sourceId: string, terms: SourcePaymentSettingsWriteDto) =>
    send(adminRoutes.savePaymentTerms, { params: { id: sourceId }, body: terms }),
  paymentTermsHistory: (sourceId: string, signal?: AbortSignal) =>
    send(adminRoutes.paymentTermsHistory, of(sourceId, signal)),
  paymentSettings: (signal?: AbortSignal) => send(adminRoutes.paymentSettings, { signal }),
  savePaymentSettings: (settings: NewsPaymentSettingsWriteDto) =>
    send(adminRoutes.savePaymentSettings, { body: settings }),
  /** A page of SUBS's accounts and paying organisations, the soonest expiry first by default. */
  subscriptions: (query: AdminSubscriptionQuery, signal?: AbortSignal) =>
    send(adminRoutes.subscriptions, { query: { ...query }, signal }),
  subscriptionStats: (signal?: AbortSignal) => send(adminRoutes.subscriptionStats, { signal }),
  subscriptionPlans: (signal?: AbortSignal) => send(adminRoutes.subscriptionPlans, { signal }),
  /** Every row of the filters as CSV, not only the page shown. */
  exportSubscriptions: (query: Omit<AdminSubscriptionQuery, 'page' | 'pageSize'>) =>
    sendBlob(adminRoutes.exportSubscriptions, { query: { format: 'csv', ...query } }),
  subscription: (accountId: string, signal?: AbortSignal) =>
    send(adminRoutes.subscription, { params: { accountId }, signal }),
  subscriptionPayments: (accountId: string, signal?: AbortSignal) =>
    send(adminRoutes.subscriptionPayments, { params: { accountId }, signal }),
  subscriptionInvoices: (accountId: string, signal?: AbortSignal) =>
    send(adminRoutes.subscriptionInvoices, { params: { accountId }, signal }),
  /** A change of plan as PUT .../plan would make it today. */
  planChangeProration: (
    accountId: string,
    change: SubscriptionPlanWriteDto,
    signal?: AbortSignal,
  ) =>
    send(adminRoutes.planChangeProration, { params: { accountId }, query: { ...change }, signal }),
  changeSubscriptionPlan: (accountId: string, change: SubscriptionPlanWriteDto) =>
    send(adminRoutes.changeSubscriptionPlan, { params: { accountId }, body: change }),
  extendSubscription: (accountId: string, extension: SubscriptionExtendDto) =>
    send(adminRoutes.extendSubscription, { params: { accountId }, body: extension }),
  suspendSubscription: (accountId: string, reason: string) =>
    send(adminRoutes.suspendSubscription, { params: { accountId }, body: { reason } }),
  reactivateSubscription: (accountId: string, reason: string) =>
    send(adminRoutes.reactivateSubscription, { params: { accountId }, body: { reason } }),
  invoicePdf: (id: string) => sendBlob(adminRoutes.invoicePdf, { params: { id } }),
  /** E-mailed again to the user it bills, or to the organisation's administrators. */
  resendInvoice: (id: string) => send(adminRoutes.resendInvoice, { params: { id } }),
}
