import type { IsoDate, IsoDateTime } from './common'

/** Treasury bills (BTA, term in weeks) and bonds (OTA, term in years) auctioned by the BEAC. */
export type AuctionInstrument = 'BTA' | 'OTA'

/** The master's BTA or OTA an auction issued (sixth version, screen 33). */
export interface AuctionSecurityDto {
  id: string
  /** "BTA CMR 26 wk 05/2027", "OTA CMR 5 yr 2031". */
  code: string
}

interface AuctionFields {
  id: string
  date: IsoDate
  country: string
  instrument: AuctionInstrument
  /** Weeks for a BTA, years for an OTA: "BTA 26 wk", "OTA 3 yr". */
  term: number
  maturityDate: IsoDate
  amountOffered: number
  valueDate: IsoDate | null
}

/**
 * GET /auctions?status=done&country=&type=&from=&to=: results of the BEAC auctions, newest first
 * (spec sections 2 and 11). Amounts are in millions of XAF, rates in percent. The sixth version
 * adds the security, the value date, the bidders and the change from the previous auction of the
 * same security (screen 33).
 */
export interface AuctionDto extends AuctionFields {
  status: 'done'
  amountBid: number
  amountAllotted: number
  /** Bids over amount offered: the auction is covered above 1. */
  coverRatio: number
  averageRate: number
  marginalRate: number
  security: AuctionSecurityDto | null
  bidders: number | null
  /** The average rate's change from the previous auction of the same state, instrument and term. */
  changeBp: number | null
}

/** GET /auctions?status=planned: an auction of the Treasuries' calendars still to come. */
export interface PlannedAuctionDto extends AuctionFields {
  status: 'planned'
  amountBid: null
  amountAllotted: null
  coverRatio: null
  averageRate: null
  marginalRate: null
  security: null
  bidders: null
  changeBp: null
}

/** A reference rate of AUC's indicators: the latest 52-week BTA or 5-year OTA. */
export interface AuctionReferenceRateDto {
  /** "52W", "5Y". */
  tenor: string
  instrument: AuctionInstrument
  term: number
  country: string | null
  date: IsoDate | null
  averageRate: number | null
}

/**
 * GET /auctions/summary?year=&country=&type= (screen 33): the year's amount raised (millions of
 * XAF), auctions, average cover (bids over offers), the latest reference rates, the next auction.
 */
export interface AuctionSummaryDto {
  year: number
  amountRaised: number
  auctions: number
  averageCover: number | null
  referenceRates: AuctionReferenceRateDto[]
  next: PlannedAuctionDto | null
}

export interface AuctionBidDto {
  rate: number
  amount: number
  /** At or under the marginal rate. */
  allotted: boolean
}

/** GET /auctions/{id}: a result and its bids by rate, lowest first (empty when unpublished). */
export interface AuctionDetailDto {
  auction: AuctionDto
  bids: AuctionBidDto[]
}

/**
 * GET /auctions/rates?tenor=&countries= (screen 33): a tenor's average rate by month over 24
 * months, a line a state, null for a month without an auction.
 */
export interface AuctionRatesDto {
  /** "52W", "26W", "2Y"… */
  tenor: string
  instrument: AuctionInstrument
  term: number
  /** "2024-12" to the current month. */
  months: string[]
  series: { country: string; rates: (number | null)[] }[]
}

export type PublicOfferStatus = 'upcoming' | 'open' | 'closed' | 'withdrawn'

/** GET /public-offers (APE, screen 33): a public bond issue, amounts in millions of XAF. */
export interface PublicOfferDto {
  id: string
  issuer: string
  issuerKind: 'sovereign' | 'company'
  country: string
  amountSought: number
  couponPct: number
  maturityDate: IsoDate
  subscriptionStart: IsoDate
  subscriptionEnd: IsoDate
  arranger: string
  status: PublicOfferStatus
  amountRaised: number | null
  updatedAt: IsoDateTime
}

/** POST /data/public-offers, PUT /data/public-offers/{id}: what CORR enters of an issue. */
export interface PublicOfferInput {
  issuer: string
  issuerKind: 'sovereign' | 'company'
  country: string
  amountSought: number
  couponPct: number
  maturityDate: IsoDate
  subscriptionStart: IsoDate
  subscriptionEnd: IsoDate
  arranger: string
  amountRaised: number | null
  withdrawn: boolean
}
