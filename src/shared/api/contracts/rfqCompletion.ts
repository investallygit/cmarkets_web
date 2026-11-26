import type { IsoDateTime } from './common'

// The RFQ completion ratio (screen 22, sixth version; ROADMAP step 62, decisions 51 to 55), as
// CMarket.Api's phase 47 serves it.

/** "96% (48)", or "New (3)" (`percent` null) under 5 cases (decision 52). */
export interface RfqCompletionDto {
  percent: number | null
  cases: number
  isNew: boolean
}

/** Both ratios of an organisation or a trader. */
export interface RfqCompletionPairDto {
  requester: RfqCompletionDto
  responder: RfqCompletionDto
}

export type RfqCompletionRole = 'requester' | 'responder'
export type RfqCompletionOutcome = 'success' | 'failure' | 'neutral'
export type RfqCompletionCause =
  | 'concluded'
  | 'requestCancelled'
  | 'requestExpired'
  | 'svtRejected'
  | 'svtExpired'
  | 'counterparty'
  | 'mutualCancellation'
export type RfqDisputeStatus = 'open' | 'upheld' | 'rejected'

export interface RfqCompletionCauseDto {
  outcome: RfqCompletionOutcome
  cause: RfqCompletionCause
  cases: number
}

/** A role's ratio, its successes, failures and neutral cases, by cause. */
export interface RfqCompletionRoleDto {
  ratio: RfqCompletionDto
  successes: number
  failures: number
  neutral: number
  causes: RfqCompletionCauseDto[]
}

/** The answers withdrawn before the confirmation, over the answers sent. */
export interface RfqWithdrawalsDto {
  sent: number
  withdrawn: number
  percent: number | null
}

export interface RfqDisputeSummaryDto {
  id: string
  status: RfqDisputeStatus
  raisedAt: IsoDateTime
  reason: string
  decidedAt: IsoDateTime | null
  answer: string | null
}

export interface RfqCompletionPartyDto {
  id: string
  name: string
  organization: string
}

/** A failure or a neutral case, for the organisation's members and the Admin. */
export interface RfqCompletionCaseDto {
  id: string
  role: RfqCompletionRole
  trader: RfqCompletionPartyDto
  requestNumber: string
  agreementNumber: string | null
  outcome: RfqCompletionOutcome
  cause: RfqCompletionCause
  occurredAt: IsoDateTime
  neutralized: boolean
  neutralizationReason: string | null
  dispute: RfqDisputeSummaryDto | null
  /** The trader concerned or a Manager of its organisation, on a failure without a dispute. */
  mayDispute: boolean
}

/**
 * GET /rfq/participants/{orgId}/completion (and the Admin's /admin/rfq/completion/participants/
 * {orgId}): both roles over `months`, the withdrawal rate; the cases for its own members, null for
 * another organisation.
 */
export interface RfqCompletionDetailDto {
  organizationId: string
  organization: string
  trader: RfqCompletionPartyDto | null
  months: number
  requester: RfqCompletionRoleDto
  responder: RfqCompletionRoleDto
  withdrawals: RfqWithdrawalsDto
  cases: RfqCompletionCaseDto[] | null
}

export interface RfqCompletionQuery {
  period?: number
  traderId?: string
}

/** POST /rfq/completion/{caseId}/disputes: multipart, the reason and up to three files. */
export interface RfqDisputeInput {
  reason: string
  files: File[]
}

export interface RfqDisputeFileDto {
  index: number
  fileName: string
  contentType: string
  length: number
}

/** A dispute on the Admin's RFQ screen (decision 54). */
export interface RfqDisputeDto {
  id: string
  status: RfqDisputeStatus
  caseId: string
  role: RfqCompletionRole
  trader: RfqCompletionPartyDto
  raisedBy: RfqCompletionPartyDto
  requestNumber: string
  agreementNumber: string | null
  cause: RfqCompletionCause
  occurredAt: IsoDateTime
  reason: string
  files: RfqDisputeFileDto[]
  raisedAt: IsoDateTime
  decidedAt: IsoDateTime | null
  answer: string | null
}

/** GET /admin/rfq/completion/participants: the organisations with cases over the window. */
export interface RfqParticipantDto {
  organizationId: string
  organization: string
  completion: RfqCompletionPairDto
  openDisputes: number
}

export interface RfqCompletionCaseDecidedDto {
  caseId: string
  neutralized: boolean
  disputeStatus: RfqDisputeStatus | null
}

/** The Admin's reason: a case neutralised, a dispute turned down. */
export interface RfqCompletionReasonInput {
  reason: string
}
