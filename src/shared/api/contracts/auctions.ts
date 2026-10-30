import type { IsoDate } from './common'

/** Treasury bills (BTA, term in weeks) and bonds (OTA, term in years) auctioned by the BEAC. */
export type AuctionInstrument = 'BTA' | 'OTA'

/**
 * GET /auctions?country=&instrument=&from=&to=: results of the BEAC auctions, newest first
 * (spec sections 2 and 11). Amounts are in millions of XAF, rates in percent.
 */
export interface AuctionDto {
  id: string
  date: IsoDate
  country: string
  instrument: AuctionInstrument
  /** Weeks for a BTA, years for an OTA: "BTA 26 wk", "OTA 3 yr". */
  term: number
  maturityDate: IsoDate
  amountOffered: number
  amountBid: number
  amountAllotted: number
  /** Bids over amount offered: the auction is covered above 1. */
  coverRatio: number
  averageRate: number
  marginalRate: number
}
