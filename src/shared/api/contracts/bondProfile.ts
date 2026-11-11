import type { CreditBucket, RatingAgency } from './bondScreener'
import type { IsoDate } from './common'

// The bond profile (spec, screen 20, DES on a bond): what it shows besides the bond's terms
// (GET /bonds/{id}) and its daily figures (GET /bonds/{id}/analytics).

/** An agency's rating in force and the day it was given; both null when it does not rate the bond ("NR"). */
export interface AgencyRatingDto {
  agency: RatingAgency
  rating: string | null
  ratedOn: IsoDate | null
}

/** What a rating did to the agency's previous one, on the notches of the composite. */
export type RatingAction = 'new' | 'upgrade' | 'downgrade' | 'affirmed'

/** A rating given, with the agency's rating it replaced (null for its first). */
export interface RatingHistoryItemDto {
  agency: RatingAgency
  rating: string
  ratedOn: IsoDate
  previous: string | null
  action: RatingAction
}

/**
 * GET /bonds/{id}/ratings?date=: S&P's, Moody's and Fitch's ratings in force, in this order; the
 * composite (null when not rated) and its bucket; every rating given, the latest first.
 */
export interface BondRatingsDto {
  bondId: string
  date: IsoDate
  agencies: AgencyRatingDto[]
  composite: string | null
  bucket: CreditBucket
  history: RatingHistoryItemDto[]
}

/** A payment per 100 of original face value; the principal outstanding after it. */
export interface UpcomingCashFlowDto {
  date: IsoDate
  coupon: number
  principal: number
  total: number
  outstanding: number
}

/**
 * GET /bonds/{id}/cashflows?from=: the payments on or after the date (today by default), the next
 * coupon's date and the days to it, none for a zero coupon or once the last coupon is paid.
 */
export interface BondCashFlowsDto {
  bondId: string
  from: IsoDate
  nextCouponDate: IsoDate | null
  daysToNextCoupon: number | null
  items: UpcomingCashFlowDto[]
}
