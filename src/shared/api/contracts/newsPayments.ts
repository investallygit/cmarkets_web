import type { IsoDateTime } from './common'
import type { AccountType } from './me'
import type { NewsItemSourceDto, NewsType } from './news'

/**
 * MPAY, the media payments (spec screen 18, section 10 "Media payments"; CMarket.Api phase 21):
 * each partner newspaper's monthly statement from its unique clicks, its click anomalies, the
 * changes a second Admin confirms, the payment settings by month; the newspaper's statements in
 * its studio (screen 13).
 */

/**
 * Where a statement stands: computed on the calculation day, under review while a click anomaly
 * is open, to approve, approved (the amount locked, the newspaper may dispute it), paid; disputed
 * by the newspaper; on hold, set aside by the Admin.
 */
export const STATEMENT_STATUSES = [
  'computed',
  'underReview',
  'toApprove',
  'approved',
  'paid',
  'disputed',
  'onHold',
] as const
export type StatementStatus = (typeof STATEMENT_STATUSES)[number]

/** How a statement is paid. */
export const STATEMENT_PAYMENT_METHODS = ['transfer', 'mobileMoney'] as const
export type StatementPaymentMethod = (typeof STATEMENT_PAYMENT_METHODS)[number]

/** What the anti-fraud checks noticed: a spike on an item, accounts on one address, new accounts. */
export type ClickAnomalySignal = 'spike' | 'sharedAddress' | 'newAccounts'

/** Open (to handle), invalidated, kept with a reason, or excluded by a rule already. */
export type ClickAnomalyDecision = 'open' | 'invalidated' | 'kept' | 'excludedByRule'

/** Why a change waits for a second Admin. */
export type SecondAdminReason = 'amount' | 'openAnomaly' | 'notApproved' | 'leavingPaid'

export type DisputeResolution = 'maintain' | 'correct'

/** Why a click is not paid (spec section 16, "Excluded clicks"). */
export type NewsViewExclusion =
  | 'ownAccount'
  | 'employee'
  | 'suspendedAccount'
  | 'newAccount'
  | 'automated'
  | 'withdrawn'
  | 'invalidated'

/** Who did something; null where the system did. */
export interface StatementPersonDto {
  id: string
  displayName: string
}

/**
 * A row of MPAY's statements (GET /admin/news-statements?month=2026-10&status=), the largest
 * amount due first: the newspaper, its rate, items, unique, excluded and payable clicks, gross
 * amount, cap, what the month before carried over, amount due and status.
 */
export interface NewsStatementRowDto {
  id: string
  /** "2026-10". */
  month: string
  /** "MPAY-2026-10-DAILYK": the transfer file and the PDF name it. */
  reference: string
  source: NewsItemSourceDto
  status: StatementStatus
  /** On hold: the status to come back to. */
  previousStatus: StatementStatus | null
  ratePerClick: number
  /** null: no cap. */
  monthlyCap: number | null
  items: number
  uniqueClicks: number
  excludedClicks: number
  payableClicks: number
  grossAmount: number
  capApplied: boolean
  carriedIn: number
  /** 0 when the whole is below the minimum payment and carried over. */
  amountDue: number
  carriedOver: number
  openAnomalies: number
  currency: string
}

/** MPAY's header (GET /admin/news-statements/summary?month=). */
export interface NewsStatementsSummaryDto {
  month: string
  statements: number
  amountDue: number
  payableClicks: number
  excludedClicks: number
  openAnomalies: number
  amountPaid: number
  currency: string
}

/** An item's clicks in a statement (GET /admin/news-statements/{id}/items?sort=clicks|headline|published). */
export interface StatementItemDto {
  newsId: string
  type: NewsType
  headline: string
  publishedAt: IsoDateTime | null
  uniqueClicks: number
  excludedClicks: number
  payableClicks: number
}

export interface StatementPaymentDto {
  id: string
  /** "2026-11-05". */
  paidOn: string
  method: StatementPaymentMethod
  reference: string
  recordedBy: StatementPersonDto | null
  recordedAt: IsoDateTime
  /** Taken out of Paid by a second Admin: the payment stays in the history, cancelled. */
  cancelledAt: IsoDateTime | null
  cancelledBy: StatementPersonDto | null
}

export interface StatementDisputeDto {
  id: string
  reason: string
  openedBy: StatementPersonDto | null
  openedAt: IsoDateTime
  /** Set by the Admin for a dispute that came outside the platform. */
  byAdmin: boolean
  resolution: DisputeResolution | null
  answer: string | null
  resolvedBy: StatementPersonDto | null
  resolvedAt: IsoDateTime | null
}

/** A change waiting for a second Admin. */
export interface StatementRequestDto {
  id: string
  status: StatementStatus
  reason: string
  why: SecondAdminReason
  requestedBy: StatementPersonDto | null
  requestedAt: IsoDateTime
  paidOn: string | null
  method: StatementPaymentMethod | null
  paymentReference: string | null
}

/** GET /admin/news-statements/{id}: MPAY's right panel. */
export interface NewsStatementDto extends NewsStatementRowDto {
  articleItems: number
  flashItems: number
  /** The gross amount within the cap. */
  monthAmount: number
  computedAt: IsoDateTime
  approvedAt: IsoDateTime | null
  approvedBy: StatementPersonDto | null
  /** The last moment the newspaper may dispute the approved amount. */
  disputeUntil: IsoDateTime | null
  /** The newest first; a cancelled one stays. */
  payments: StatementPaymentDto[]
  openDispute: StatementDisputeDto | null
  pendingRequest: StatementRequestDto | null
  /** The five most clicked items. */
  topItems: StatementItemDto[]
}

/** A line of GET /admin/news-statements/{id}/history, oldest first. */
export interface StatementHistoryEntryDto {
  number: number
  at: IsoDateTime
  /** null on the first line, when the statement was computed. */
  from: StatementStatus | null
  to: StatementStatus
  amountDue: number
  reason: string | null
  /** null: the system. */
  by: StatementPersonDto | null
  confirmedBy: StatementPersonDto | null
}

/**
 * PUT /admin/news-statements/{id}/status: the status picked and its reason (always required);
 * Paid needs the payment's date, method and reference. 409 `statementSecondAdmin` with
 * `requestId` and `why` when a second Admin must confirm it.
 */
export interface StatementStatusWriteDto {
  status: StatementStatus
  reason: string
  /** "2026-11-05". */
  paidAt?: string
  method?: StatementPaymentMethod
  reference?: string
}

/** POST /admin/news-statements/{id}/disputes/{disputeId}/resolve. */
export interface DisputeResolutionWriteDto {
  resolution: DisputeResolution
  reason: string
}

export interface AnomalyItemDto {
  newsId: string
  type: NewsType
  headline: string
}

/** GET /admin/news-clicks/anomalies?month=&sourceId=: by signal, the latest day first. */
export interface ClickAnomalyDto {
  id: string
  sourceId: string
  month: string
  /** The day in Douala, "2026-10-28". */
  day: string
  signal: ClickAnomalySignal
  /** A spike: the item's clicks over the newspaper's average. */
  ratio: number | null
  /** The accounts on the address, or the new accounts. */
  accounts: number | null
  address: string | null
  clicks: number
  itemCount: number
  /** Twenty at most; `itemCount` says them all. */
  items: AnomalyItemDto[]
  decision: ClickAnomalyDecision
  reason: string | null
  decidedBy: StatementPersonDto | null
  decidedAt: IsoDateTime | null
}

/** GET /admin/news-clicks/anomalies/{id}/clicks ("View click details"), the latest first. */
export interface AnomalyClickDto {
  viewedAt: IsoDateTime
  newsId: string
  type: NewsType
  headline: string
  user: StatementPersonDto
  accountType: AccountType
  ipAddress: string | null
  device: string | null
  exclusion: NewsViewExclusion | null
}

/** POST /admin/news-clicks/anomalies/{id}/decision: the clicks invalidated or kept, with a reason. */
export interface AnomalyDecisionWriteDto {
  decision: 'invalidate' | 'keep'
  reason: string
}

/** A dated version of a newspaper's payment settings. */
export interface SourcePaymentSettingsDto {
  id: string
  sourceId: string
  ratePerClick: number
  monthlyCap: number | null
  /** "2026-11": the month it applies from. */
  effectiveFrom: string
  createdAt: IsoDateTime
  createdBy: StatementPersonDto | null
}

/** GET /admin/news-sources/{id}/payment-settings: this month's terms, their version, those to come. */
export interface SourcePaymentTermsDto {
  sourceId: string
  month: string
  ratePerClick: number
  monthlyCap: number | null
  /** null: the global defaults. */
  version: SourcePaymentSettingsDto | null
  upcoming: SourcePaymentSettingsDto[]
  currency: string
}

/** PUT /admin/news-sources/{id}/payment-settings: a positive whole rate, a cap or none, a month. */
export interface SourcePaymentSettingsWriteDto {
  ratePerClick: number
  monthlyCap: number | null
  effectiveFrom: string
}

/** The version saved and the statements not approved yet it computed again. */
export interface SourcePaymentSettingsSavedDto {
  version: SourcePaymentSettingsDto
  recomputed: number
}

/** GET / PUT /admin/news-payment-settings (MPAY, "Global settings"). */
export interface NewsPaymentSettingsDto {
  defaultRatePerClick: number
  defaultMonthlyCap: number | null
  minimumPayment: number
  fourEyesThreshold: number
  disputeWindowDays: number
  /** 1 to 28. */
  calculationDay: number
  /** "02:00", in Douala. */
  calculationTime: string
  spikeFactor: number
  sharedAddressAccounts: number
  updatedAt: IsoDateTime | null
  currency: string
}

export type NewsPaymentSettingsWriteDto = Omit<NewsPaymentSettingsDto, 'updatedAt' | 'currency'>

/** The newspaper's dispute, as its studio shows it. */
export interface ProviderDisputeDto {
  reason: string
  openedAt: IsoDateTime
  resolution: DisputeResolution | null
  answer: string | null
  resolvedAt: IsoDateTime | null
}

/**
 * GET /provider/statements (screen 13): the newspaper's statements, the latest first; the PDF once
 * approved, a dispute within the window (POST /provider/statements/{id}/dispute).
 */
export interface ProviderStatementDto {
  id: string
  month: string
  reference: string
  status: StatementStatus
  ratePerClick: number
  monthlyCap: number | null
  items: number
  uniqueClicks: number
  excludedClicks: number
  payableClicks: number
  grossAmount: number
  capApplied: boolean
  carriedIn: number
  amountDue: number
  carriedOver: number
  approvedAt: IsoDateTime | null
  disputeUntil: IsoDateTime | null
  canDispute: boolean
  hasPdf: boolean
  paidOn: string | null
  paymentMethod: StatementPaymentMethod | null
  dispute: ProviderDisputeDto | null
  currency: string
}
