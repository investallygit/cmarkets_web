import type { BondPriceSource } from './bondScreener'
import type { DayCount } from './bonds'
import type { IsoDate } from './common'

// BP, bond pricing (spec screen 16; section 10, "Bond pricing").

/** The day-count conventions a bond entered by hand may follow, ACT/ACT ICMA first (spec section 14.1). */
export const DAY_COUNTS = [
  'ACT/ACT ICMA',
  'ACT/365F',
  'ACT/360',
  '30/360',
] as const satisfies readonly DayCount[]

/** Coupons a year: k of screen 16, 12 too as section 14.4 allows. */
export const COUPON_FREQUENCIES = [1, 2, 4, 12] as const
export type CouponFrequency = (typeof COUPON_FREQUENCIES)[number]

/**
 * Where the yield priced at comes from: the user's; the bond's last yield of the daily calculation
 * (BS); its country's curve plus its spread; none of them.
 */
export type BondYieldSource = 'input' | 'bs' | 'curve' | 'none'

/** A share of the original face repaid on a payment date, in percent. */
export interface BondRedemptionDto {
  date: IsoDate
  pct: number
}

/**
 * GET /bonds/{id}/market-yield: the yield BP starts from, compounded at the coupon frequency, and
 * the settlement of a trade on the date on the bond's market (T+1 or T+2).
 */
export interface MarketYieldDto {
  bondId: string
  /** The trade date: today by default. */
  date: IsoDate
  settlementDate: IsoDate
  /** n of T+n. */
  settlementSessions: number
  /** Null when neither a calculation nor a curve gives one. */
  ytmPct: number | null
  source: Exclude<BondYieldSource, 'input'>
  /** The session of the calculation, or of the curve. */
  asOf: IsoDate | null
  /** For BS: a quote or a model price. */
  priceSource: BondPriceSource | null
  /** For a curve: its annual yield at the bond's average life, and the spread added. */
  curveYieldPct: number | null
  spreadBp: number | null
}

/**
 * POST /bonds/price: a bond of the list (`bondId`) or its characteristics entered by hand. Without
 * a settlement date, a trade today settling as its market does; without a yield, a bond of the list
 * at its market yield.
 */
export interface BondPriceRequestDto {
  bondId?: string
  /** M: what the principal is repaid at, per 100 of face value (100 by default). */
  faceValue?: number
  /** C: the annual coupon rate, in percent. */
  couponRate?: number
  frequency?: CouponFrequency
  maturityDate?: IsoDate
  settlementDate?: IsoDate
  dayCount?: DayCount
  /** The shares repaid on payment dates; a bullet bond without it. */
  redemptionSchedule?: BondRedemptionDto[]
  /** The yield to maturity in percent, compounded at the coupon frequency. */
  ytm?: number
  /** Original face amount, in the bond's currency. */
  faceAmount: number
  /** The parallel shifts of the rate sensitivity: ±25, ±50 and ±100 bp by default. */
  shiftsBp?: number[]
}

/** A payment still to come, per 100 of the principal outstanding at settlement. */
export interface BondPriceCashFlowDto {
  date: IsoDate
  /** t_i = (w + i − 1) / f. */
  years: number
  coupon: number
  principal: number
  cashFlow: number
  discountFactor: number
  /** The present values add up to the dirty price. */
  presentValue: number
}

/** The prices for a parallel shift of the yield; 0 is the yield itself. */
export interface BondPriceShiftDto {
  shiftBp: number
  ytmPct: number
  cleanPrice: number
  dirtyPrice: number
  /** Of the clean price, in points. */
  priceChange: number
  /** Of the dirty price, in percent. */
  dirtyChangePct: number
}

/** A point of the price-yield curve. */
export interface PriceYieldPointDto {
  ytmPct: number
  cleanPrice: number
}

/** POST /bonds/price: the three blocks of results, the cash flows, the sensitivity and the curve. */
export interface BondPriceDto {
  /** Null for a bond entered by hand. */
  bondId: string | null
  settlementDate: IsoDate
  ytmPct: number
  ytmSource: BondYieldSource
  faceAmount: number
  /** Per 100 of the principal outstanding at settlement. */
  pricing: {
    dirtyPrice: number
    accruedInterest: number
    cleanPrice: number
    accruedDays: number
    periodDays: number
    outstandingPct: number
  }
  /** Durations in years, DV01 in the bond's currency for the face amount. */
  risk: {
    macaulayDuration: number
    modifiedDuration: number
    convexity: number
    dv01: number
  }
  /** Amounts in the bond's currency for the face amount; lives in years. */
  supplemental: {
    /** Null for a zero coupon. */
    currentYieldPct: number | null
    settlementAmount: number
    timeToMaturity: number
    averageLife: number
    outstandingFace: number
    accruedAmount: number
  }
  cashFlows: BondPriceCashFlowDto[]
  sensitivity: BondPriceShiftDto[]
  /** The clean price 3 points either side of the yield, a quarter point apart. */
  priceYield: PriceYieldPointDto[]
}

/** GET /bonds/{id}/price-yield: the clean price at each yield of a range. */
export interface PriceYieldCurveDto {
  bondId: string
  settlementDate: IsoDate
  /** The market yield the range is centred on, when no range was given. */
  ytmPct: number | null
  points: PriceYieldPointDto[]
}
