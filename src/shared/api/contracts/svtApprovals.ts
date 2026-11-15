import type { IsoDateTime, TimeOfDay } from './common'
import type { LicensedSvtDto } from './rfq'
import type {
  RfqAgreementDto,
  RfqAgreementStatus,
  RfqPartyDto,
  RfqSecurityRefDto,
  RfqSide,
} from './rfqTrading'

// The SVTs' approvals (spec section 10, screen 27; ROADMAP step 45, CMarket.Api's phase 36).

/** An approval's status (spec, screen 22's statuses). */
export type SvtApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired'

/** The leg an SVT approves: the buyer's, the seller's, or both when both sides chose it. */
export type SvtApprovalSide = 'buyer' | 'seller' | 'both'

/** "Client limit exceeded, securities not available, funds not available, unknown client or blocked account, off-market price, other (text required)". */
export type RfqRejectionReason =
  | 'clientLimitExceeded'
  | 'securitiesNotAvailable'
  | 'fundsNotAvailable'
  | 'unknownClientOrBlockedAccount'
  | 'offMarketPrice'
  | 'other'

/** The Admin's window, which every bank follows: minutes, the cut-off, the next business day's deadline. */
export interface ApprovalWindowDto {
  minutes: number
  cutOffTime: TimeOfDay
  nextDayDeadline: TimeOfDay
}

/** GET /svt/summary: screen 27's counters. */
export interface SvtSummaryDto {
  svt: LicensedSvtDto
  toApprove: number
  approvedToday: number
  rejectedToday: number
  /** XAF of face approved today. */
  amountApprovedToday: number
  linkedTraders: number
  linkRequests: number
  window: ApprovalWindowDto
}

/**
 * The checks on the bank's client before a decision: its link still confirmed and since when, its
 * daily limit (null: none), what it traded today through the bank, this agreement included; an
 * overrun is flagged, "but the decision stays with the SVT".
 */
export interface ClientCheckDto {
  client: RfqPartyDto
  side: RfqSide
  linkConfirmed: boolean
  linkedSince: IsoDateTime | null
  dailyLimit: number | null
  usedToday: number
  tradesToday: number
  overLimit: boolean
}

/** An approval's decision: who decided and when (the deadline for an expiry), the reason. */
export interface ApprovalDecisionDto {
  status: SvtApprovalStatus
  decidedBy: string | null
  decidedAt: IsoDateTime | null
  reason: RfqRejectionReason | null
  comment: string | null
}

/**
 * GET /svt/approvals: an approval in the bank's lists, with the bank's client or clients (both
 * when the bank holds both legs) and their checks, the counterparty and its SVT (none then).
 */
export interface SvtApprovalItemDto {
  agreementId: string
  number: string
  confirmedAt: IsoDateTime
  deadline: IsoDateTime
  status: SvtApprovalStatus
  /** The agreement's: concluded once both SVTs approved. */
  agreementStatus: RfqAgreementStatus
  side: SvtApprovalSide
  clients: ClientCheckDto[]
  security: RfqSecurityRefDto
  faceAmount: number
  price: number
  ratePct: number
  counterparty: RfqPartyDto | null
  counterpartySvt: LicensedSvtDto | null
  /** Above the bank's threshold: two different approvers. */
  fourEyes: boolean
  /** The first of the two, once one approved. */
  firstApprover: string | null
  decision: ApprovalDecisionDto | null
}

/** An approval of an agreement as its detail shows both. */
export interface AgreementApprovalDto {
  svt: LicensedSvtDto
  side: SvtApprovalSide
  status: SvtApprovalStatus
  deadline: IsoDateTime
  firstApprover: string | null
  firstApprovedAt: IsoDateTime | null
  decision: ApprovalDecisionDto | null
}

/** GET /svt/approvals/{agreementId}: the agreement, the bank's approval, both approvals, what the reader may do. */
export interface SvtApprovalDetailDto {
  agreement: RfqAgreementDto
  requestNumber: string
  /** "agreement 1 / 3". */
  agreementCount: number
  security: RfqSecurityRefDto
  mine: SvtApprovalItemDto
  approvals: AgreementApprovalDto[]
  canApprove: boolean
  canReject: boolean
}

/** POST /svt/approvals/{agreementId}/reject */
export interface RejectAgreementInput {
  reasonCode: RfqRejectionReason
  /** Required for "other", 500 characters at most. */
  comment: string | null
}

/** A bank's SVT account, and whether it may approve. */
export interface SvtApproverDto {
  id: string
  name: string
  authorised: boolean
}

/** GET /svt/settings: the bank's approval settings, the Admin's window read only. */
export interface SvtSettingsDto {
  window: ApprovalWindowDto
  /** XAF: above it, two approvers. */
  fourEyesThreshold: number
  approvers: SvtApproverDto[]
  /** No approver listed: every SVT account of the bank approves. */
  allApprove: boolean
  /** XAF a day offered when a link is confirmed; null: none. */
  defaultClientLimit: number | null
  notifyByEmail: boolean
  notifyBySms: boolean
  rejectionReasons: RfqRejectionReason[]
  updatedAt: IsoDateTime | null
  updatedBy: string | null
}

/** PUT /svt/settings */
export interface SvtSettingsInput {
  fourEyesThreshold: number
  /** Empty: every account of the bank; listed, the one who saves among them. */
  approverIds: string[]
  defaultClientLimit: number | null
  notifyByEmail: boolean
  notifyBySms: boolean
}
