import type { IsoDate, IsoDateTime } from './common'
import type { LicensedSvtDto } from './rfq'
import type {
  RfqAgreementStatus,
  RfqInstrument,
  RfqPartyDto,
  RfqSecurityRefDto,
  RfqSide,
} from './rfqTrading'
import type { AgreementApprovalDto } from './svtApprovals'

/** The ticket's e-mail (spec, screen 23: "Agreement e-mail: Sent, Failed, Resent"), once concluded. */
export type RfqEmailStatus = 'sent' | 'failed' | 'resent'

/** The reader's role in an agreement: the request's side or the answer's. */
export type RfqAgreementRole = 'requester' | 'responder'

/**
 * The filters of RFQ AGR (spec section 10, GET /rfq/agreements): absent for every agreement. The
 * side, the role and the trader are the reader's (ROADMAP decision 26); the period is the day of
 * the agreement in Douala; the face amounts are in XAF.
 */
export interface RfqAgreementCriteria {
  from?: IsoDate
  to?: IsoDate
  status?: RfqAgreementStatus[]
  emailStatus?: RfqEmailStatus[]
  side?: RfqSide
  type?: RfqInstrument
  /** The issuing state's code ("CM"). */
  country?: string
  securityId?: string
  /** Either side's SVT: "SVT (mine or the counterparty's)". */
  svtId?: string
  role?: RfqAgreementRole
  traderId?: string
  minFace?: number
  maxFace?: number
  /** Free search: the agreement's number, the security, the counterparty. */
  q?: string
}

/** The columns GET /rfq/agreements sorts by, '-' before one for the reverse order. */
export type RfqAgreementSortKey =
  | 'number'
  | 'createdAt'
  | 'side'
  | 'security'
  | 'counterparty'
  | 'counterpartySvt'
  | 'buyer'
  | 'seller'
  | 'faceAmount'
  | 'price'
  | 'settlementAmount'
  | 'settlementDate'
  | 'status'
  | 'emailStatus'

/**
 * An agreement as the list shows it (spec, screen 23): the side, the role and the counterparty
 * are the reader's: its organisation's; an SVT's, its client's; the Admin's, the requester's.
 * Both parties and their SVTs come too, for the Admin's list.
 */
export interface RfqAgreementRowDto {
  id: string
  /** "ACC-261029-0017". */
  number: string
  createdAt: IsoDateTime
  concludedAt: IsoDateTime | null
  status: RfqAgreementStatus
  emailStatus: RfqEmailStatus | null
  side: RfqSide
  role: RfqAgreementRole
  security: RfqSecurityRefDto
  counterparty: RfqPartyDto
  counterpartySvt: LicensedSvtDto
  buyer: RfqPartyDto
  buyerSvt: LicensedSvtDto
  seller: RfqPartyDto
  sellerSvt: LicensedSvtDto
  faceAmount: number
  /** The clean price per 100, and the rate (a BTA's) or the yield (an OTA's) in percent. */
  price: number
  ratePct: number
  /** Per 100 of face at the settlement date. */
  accruedInterest: number
  /** (clean price + accrued interest) / 100 × face amount, XAF: for information. */
  settlementAmount: number
  settlementDate: IsoDate
}

/** GET /rfq/agreements: a page, with the count and total face of every agreement kept. */
export interface RfqAgreementPageDto {
  items: RfqAgreementRowDto[]
  page: number
  pageSize: number
  totalCount: number
  totalFace: number
}

/** GET /rfq/agreements/options: the values of the reader's agreements, for the filters. */
export interface RfqAgreementOptionsDto {
  securities: RfqSecurityRefDto[]
  countries: string[]
  svts: LicensedSvtDto[]
  traders: RfqPartyDto[]
}

/** The request an agreement came from: "RFQ-261029-0042 · agreement 1 / 3". */
export interface RfqAgreementRequestDto {
  id: string
  number: string
  side: RfqSide
  faceAmount: number
  anonymous: boolean
  publishedAt: IsoDateTime
  /** The agreements its confirmation made. */
  agreements: number
}

/** A party's letter, kept with the agreement. */
export interface RfqLetterDto {
  fileName: string
  /** Bytes. */
  length: number
}

export interface RfqAgreementCancellationDto {
  reason: string
  enteredBy: RfqPartyDto
  enteredAt: IsoDateTime
  requesterLetter: RfqLetterDto
  responderLetter: RfqLetterDto
}

/** What an agreement's e-mail carries: the ticket, or a notice without it. */
export type AgreementEmailKind =
  'ticket' | 'rejectionNotice' | 'expiryNotice' | 'cancellationNotice'

/**
 * The recipients of an agreement's e-mails: the requesting trader, the responding trader, the
 * securities back office of each SVT (one when both sides chose the same).
 */
export type AgreementRecipient = 'requester' | 'responder' | 'buyerSvt' | 'sellerSvt'

/** An e-mail to one recipient: sent, failed or resent, when; the mail server's error, the Admin's. */
export interface RfqAgreementEmailDto {
  kind: AgreementEmailKind
  status: RfqEmailStatus
  at: IsoDateTime
  error: string | null
}

/** "E-mail log per recipient": a recipient and its e-mails, oldest first. */
export interface RfqAgreementRecipientDto {
  kind: AgreementRecipient
  /** "T. Bekale", "Back office titres Bank D". */
  name: string
  emails: RfqAgreementEmailDto[]
}

/** The ticket, made once at the conclusion (at its first reading for an older agreement). */
export interface RfqTicketDto {
  generatedAt: IsoDateTime
  /** SHA-256, 64 hexadecimal digits. */
  fingerprint: string
}

/**
 * GET /rfq/agreements/{id}: the list's line, the request and the agreement's rank among its
 * agreements, its end, both SVTs' approvals, its e-mails by recipient, its ticket once made, its
 * cancellation, and what the reader may do: download the ticket (a concluded or cancelled
 * agreement), resend it and cancel (a concluded one; a party's Trader or Manager, the Admin).
 */
export interface RfqAgreementDetailsDto {
  agreement: RfqAgreementRowDto
  request: RfqAgreementRequestDto
  rank: number
  endedAt: IsoDateTime | null
  approvals: AgreementApprovalDto[]
  recipients: RfqAgreementRecipientDto[]
  ticket: RfqTicketDto | null
  cancellation: RfqAgreementCancellationDto | null
  hasTicket: boolean
  canResend: boolean
  canCancel: boolean
}

/** A send of the ticket again: to whom, and how it went. */
export interface RfqTicketSendDto {
  recipient: AgreementRecipient
  name: string
  status: RfqEmailStatus
}

/** POST /rfq/agreements/{id}/resend: each send, and the agreement's e-mail status after them. */
export interface RfqTicketResendDto {
  emailStatus: RfqEmailStatus
  sends: RfqTicketSendDto[]
}

/** GET, POST /rfq/agreement-filters: the filters under a name. */
export interface RfqAgreementFilterDto {
  id: string
  name: string
  criteria: RfqAgreementCriteria
  createdAt: IsoDateTime
}

export interface RfqAgreementFilterInput {
  name: string
  criteria: RfqAgreementCriteria
}

/** POST /rfq/agreements/{id}/cancel, sent as a multipart form. */
export interface RfqCancelAgreementInput {
  reason: string
  /** The requester's written request: a PDF, JPEG or PNG of 10 MB at most. */
  requesterLetter: File
  responderLetter: File
}
