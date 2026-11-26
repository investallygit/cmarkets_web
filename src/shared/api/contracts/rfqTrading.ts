import type { IsoDate, IsoDateTime } from './common'
import type { LicensedSvtDto } from './rfq'

/** The requester's side: a buyer's answers sell to it, a seller's buy from it. */
export type RfqSide = 'buy' | 'sell'

/** How the answers quote: a BTA in rate (simple, 360 days); an OTA in clean price or yield. */
export type RfqQuoteType = 'rate' | 'price' | 'yield'

/** A security the RFQ trades: a BTA (bill) or an OTA (bond) of the BEAC. */
export type RfqInstrument = 'BTA' | 'OTA'

/**
 * A request names its security, or only criteria, the responders offering the securities that
 * meet them (screen 22, sixth version; ROADMAP decisions 49 and 50). A request by criteria is a
 * purchase, ranked by yield.
 */
export type RfqMode = 'security' | 'criteria'

/** Spec, screen 22: "Published, Answers received, Confirmed, Partially filled, Cancelled, Expired". */
export type RfqRequestStatus =
  'published' | 'answersReceived' | 'confirmed' | 'partiallyFilled' | 'cancelled' | 'expired'

/** "Sent, Improved, Withdrawn, Selected, Partially selected, Not selected, Expired". */
export type RfqResponseStatus =
  'sent' | 'improved' | 'withdrawn' | 'selected' | 'partiallySelected' | 'notSelected' | 'expired'

/** "Awaiting SVT, Concluded, Rejected by an SVT, Expired, Cancelled" (ROADMAP steps 44 to 47). */
export type RfqAgreementStatus = 'awaitingSvt' | 'concluded' | 'rejected' | 'expired' | 'cancelled'

/** An outstanding BTA or OTA of the master list, with the quote types it takes. */
export interface RfqSecurityDto {
  id: string
  /** "OTA CMR 3 yr 2029". */
  code: string
  name: string
  instrument: RfqInstrument
  /** The issuing state's code ("CM"). */
  country: string
  maturityDate: IsoDate
  couponPct: number
  /** Its CRCT code. */
  isin: string | null
  quoteTypes: RfqQuoteType[]
}

/**
 * GET /rfq/setup: the securities, the settlement dates offered (T+1 on the BEAC's days first), the
 * minimum trading amount and the trader's confirmed SVTs; `canTrade` false without one.
 */
export interface RfqSetupDto {
  securities: RfqSecurityDto[]
  settlementDates: IsoDate[]
  minimumTradingAmount: number
  svts: LicensedSvtDto[]
  canTrade: boolean
}

/** A clean price per 100 and its rate (a BTA's) or yield (an OTA's), in percent. */
export interface RfqQuoteDto {
  price: number
  ratePct: number
}

/** The latest BEAC auction of the security's state, instrument and term. */
export interface RfqAuctionDto {
  date: IsoDate
  averageRatePct: number
}

/**
 * GET /rfq/pricing: the CMarket curve's reference at the settlement date, the latest auction; with
 * a value entered in a quote type, the other side worked out and the accrued interest per 100.
 */
export interface RfqPricingDto {
  securityId: string
  settlementDate: IsoDate
  reference: RfqQuoteDto | null
  auction: RfqAuctionDto | null
  quote: RfqQuoteDto | null
  accruedInterest: number | null
  /**
   * The quote's yield to maturity, annual, comparable between a BTA and an OTA (an OTA's yield, a
   * BTA's worked out from its price): what a request by criteria ranks and checks.
   */
  yieldPct: number | null
}

/** A request's criteria: an empty field imposes nothing. */
export interface RfqCriteriaDto {
  /** The lowest yield accepted, in percent. */
  minYield: number | null
  /** The longest remaining maturity at the settlement date, in years. */
  maxMaturityYears: number | null
  /** The issuing states' codes ("CM"); empty: the six CEMAC countries. */
  countries: string[]
  /** Empty: both. */
  securityTypes: RfqInstrument[]
  /** The securities eligible, drawn at publication. */
  eligible: number
}

/**
 * A security a request by criteria accepts: outstanding at the settlement date, of a country and
 * type accepted, within the maximum maturity, its last computed yield (BS's, else its state's
 * curve) at or above the minimum. Highest yield first.
 */
export interface RfqEligibleSecurityDto {
  security: RfqSecurityRefDto
  /** From the settlement date to the maturity, in years of 365 days. */
  remainingYears: number
  yieldPct: number
}

/**
 * GET /rfq/eligible-securities (the new request's preview: "the request cannot be published if no
 * security is eligible"); GET /rfq/{id}/eligible-securities answers a request's list as drawn at
 * its publication.
 */
export interface RfqEligibleQuery {
  settlementDate: IsoDate
  minYield?: number
  maxMaturityYears?: number
  countries?: string[]
  securityTypes?: RfqInstrument[]
}

/** A trader and its organisation. */
export interface RfqPartyDto {
  id: string
  name: string
  organization: string
}

/** The security of a request or an agreement, as the screens write it. */
export interface RfqSecurityRefDto {
  id: string
  code: string
  instrument: RfqInstrument
  country: string
  maturityDate: IsoDate
  isin: string | null
}

/** The responder's own answer: all a responder reads of a request's answers. */
export interface RfqMyResponseDto {
  id: string
  requestId: string
  status: RfqResponseStatus
  svt: LicensedSvtDto
  price: number
  ratePct: number
  /** XAF of face. */
  quantity: number
  validitySeconds: number
  validUntil: IsoDateTime
  sentAt: IsoDateTime
  updatedAt: IsoDateTime
  version: number
  /** At the confirmation: the face allocated to it. */
  allocatedQuantity: number | null
  /** By criteria, the security offered and its yield; null on a request for a security. */
  security: RfqSecurityRefDto | null
  yieldPct: number | null
}

/**
 * A request on the board: the requester, null when anonymous; a colleague's request marked (read,
 * not answered); the trader's own answer, never the others'.
 */
export interface RfqBoardItemDto {
  id: string
  number: string
  requester: RfqPartyDto | null
  side: RfqSide
  mode: RfqMode
  /** Null by criteria. */
  security: RfqSecurityRefDto | null
  /** Null for a security. */
  criteria: RfqCriteriaDto | null
  faceAmount: number
  quoteType: RfqQuoteType
  settlementDate: IsoDate
  /** The end of its duration: no answer after it. */
  closesAt: IsoDateTime
  /** The end of its confirmation, 10 minutes later. */
  expiresAt: IsoDateTime
  ownOrganization: boolean
  myResponse: RfqMyResponseDto | null
}

/** GET /rfq/board; `canAnswer` with a confirmed SVT. */
export interface RfqBoardDto {
  requests: RfqBoardItemDto[]
  canAnswer: boolean
}

/** An answer as the requester's organisation reads it, ranked by the selection in force. */
export interface RfqResponseDto {
  id: string
  /** Null: withdrawn, expired, out of the ranking. */
  rank: number | null
  responder: RfqPartyDto
  svt: LicensedSvtDto
  price: number
  ratePct: number
  quantity: number
  /** Its last version: the ranking's time. */
  updatedAt: IsoDateTime
  validUntil: IsoDateTime
  status: RfqResponseStatus
  /** The face the selection allocates to it. */
  allocated: number
  /** By criteria: the security offered, its yield, its remaining maturity in years. */
  security: RfqSecurityRefDto | null
  yieldPct: number | null
  remainingYears: number | null
}

export interface RfqAllocationLineDto {
  responseId: string
  rank: number
  allocated: number
}

/** GET /rfq/{id}/allocation: the selection at its version, which the confirmation names. */
export interface RfqAllocationDto {
  version: number
  lines: RfqAllocationLineDto[]
  total: number
  agreements: number
  /** Null by criteria, whose securities differ. */
  averagePrice: number | null
  /** By criteria, the yield's. */
  averageRatePct: number | null
  /** The securities of the agreements; by criteria, their maturity weighted by the face allocated. */
  securities: number
  averageMaturityYears: number | null
}

/** An agreement made at a confirmation: its parties and SVTs, its amounts (ROADMAP step 44). */
export interface RfqAgreementDto {
  id: string
  /** "ACC-261029-0017". */
  number: string
  /** "agreement 1 / 3". */
  rank: number
  status: RfqAgreementStatus
  buyer: RfqPartyDto
  buyerSvt: LicensedSvtDto
  seller: RfqPartyDto
  sellerSvt: LicensedSvtDto
  faceAmount: number
  price: number
  ratePct: number
  /** Per 100 of face at the settlement date. */
  accruedInterest: number
  /** (clean price + accrued interest) / 100 × face amount, XAF. */
  settlementAmount: number
  settlementDate: IsoDate
  createdAt: IsoDateTime
}

/**
 * GET /rfq/{id}: a request as its reader may see it. Its organisation reads the requester, its SVT,
 * the ranked answers and the selection; a responder its own answer and its agreements.
 */
export interface RfqRequestDto {
  id: string
  /** "RFQ-261029-0042". */
  number: string
  requester: RfqPartyDto | null
  svt: LicensedSvtDto | null
  side: RfqSide
  mode: RfqMode
  /** Null by criteria. */
  security: RfqSecurityRefDto | null
  /** Null for a security. */
  criteria: RfqCriteriaDto | null
  faceAmount: number
  /** By criteria, 'yield': the answers rank by yield. */
  quoteType: RfqQuoteType
  settlementDate: IsoDate
  durationSeconds: number
  anonymous: boolean
  /** The CMarket curve's model price and rate or yield at publication. */
  reference: RfqQuoteDto | null
  publishedAt: IsoDateTime
  closesAt: IsoDateTime
  expiresAt: IsoDateTime
  status: RfqRequestStatus
  closedAt: IsoDateTime | null
  filledAmount: number | null
  /** The reader published it: it confirms or cancels. */
  mine: boolean
  ownOrganization: boolean
  responses: RfqResponseDto[] | null
  allocation: RfqAllocationDto | null
  myResponse: RfqMyResponseDto | null
  agreements: RfqAgreementDto[]
}

/** GET /rfq/mine: the trader's requests of the day and those open, or its organisation's. */
export interface RfqRequestSummaryDto {
  id: string
  number: string
  requester: RfqPartyDto
  side: RfqSide
  mode: RfqMode
  security: RfqSecurityRefDto | null
  criteria: RfqCriteriaDto | null
  faceAmount: number
  publishedAt: IsoDateTime
  closesAt: IsoDateTime
  expiresAt: IsoDateTime
  status: RfqRequestStatus
  answers: number
  filledAmount: number | null
  agreements: number | null
}

/** What a line of the blotter tells. */
export type RfqBlotterEventKind =
  | 'requestConfirmed'
  | 'requestPartiallyFilled'
  | 'requestCancelled'
  | 'requestExpired'
  | 'answerSelected'
  | 'answerPartiallySelected'
  | 'answerNotSelected'
  | 'agreementConcluded'
  | 'agreementRejected'
  | 'agreementExpired'
  | 'agreementCancelled'

export interface RfqBlotterEventDto {
  at: IsoDateTime
  kind: RfqBlotterEventKind
  requestId: string
  requestNumber: string
  agreementNumber: string | null
  /** The agreements a confirmation made. */
  agreements: number | null
  /** An amount, of a total: an answer's 200 M of 300 M. */
  amount: number | null
  of: number | null
}

/** GET /rfq/blotter: the day's counts and latest events. */
export interface RfqBlotterDto {
  date: IsoDate
  requestsPublished: number
  answersSent: number
  answersSelected: number
  agreements: number
  events: RfqBlotterEventDto[]
}

interface RfqPublishCommon {
  faceAmount: number
  settlementDate: IsoDate
  durationSeconds: number
  svtId: string
  anonymous: boolean
}

/** POST /rfq: for a security, or by criteria (a purchase; an empty criterion imposes nothing). */
export type RfqPublishInput = RfqPublishCommon &
  (
    | { mode: 'security'; securityId: string; side: RfqSide; quoteType: RfqQuoteType }
    | {
        mode: 'criteria'
        minYield: number | null
        maxMaturityYears: number | null
        countries: string[]
        securityTypes: RfqInstrument[]
      }
  )

/** POST /rfq/{id}/responses and PUT /rfq/{id}/responses/{responseId}: `value` in the request's quote type. */
export interface RfqAnswerInput {
  /** By criteria, required: a security of the request's eligible list. */
  securityId?: string
  /** By criteria, a BTA's rate or an OTA's clean price; else in the request's quote type. */
  value: number
  quantity: number
  svtId: string
  validitySeconds: number
}

/** POST /rfq/{id}/confirm: the version of the selection shown. */
export interface RfqConfirmInput {
  allocationVersion: number
}
