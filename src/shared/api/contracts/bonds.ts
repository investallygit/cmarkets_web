import type { CurrencyCode, IsoDate } from './common'

/** Day-count convention, taken from the prospectus (spec section 14.1). */
export type DayCount = 'ACT/ACT ICMA' | 'ACT/365F' | 'ACT/360' | '30/360'

/** A future payment, per 100 of original face value. */
export interface BondCashFlowDto {
  date: IsoDate
  coupon: number
  amortization: number
  /** Principal outstanding after the payment. */
  outstanding: number
}

/** GET /bonds: listed bonds and government securities. */
export interface BondSummaryDto {
  id: string
  code: string
  name: string
  issuer: string
  country: string
  currency: CurrencyCode
  couponPct: number
  /** Coupons per year. */
  frequency: number
  issueDate: IsoDate
  maturityDate: IsoDate
  /** Schedule: the shares of an amortization schedule (bond list, spec section 11). */
  amortization: 'bullet' | 'straight' | 'schedule'
  dayCount: DayCount
  /** Face value of one bond at issue, in the bond's currency. */
  nominal: number
  /** Amount outstanding, in the bond's currency. */
  amountOutstanding: number
}

/** GET /bonds/{id}: terms and cash-flow schedule. */
export interface BondDto extends BondSummaryDto {
  schedule: BondCashFlowDto[]
}

/**
 * POST /bonds/{id}/calculate, with the clean price or the yield: the server computes the other
 * one (spec section 14.1).
 */
export interface BondCalculationRequestDto {
  settlementDate: IsoDate
  /** Original face amount, in the bond's currency. */
  faceAmount: number
  /** Per 100 of the principal outstanding at settlement. */
  cleanPrice?: number
  /** In percent. */
  yieldPct?: number
}

/**
 * Prices are per 100 of the principal outstanding at settlement, amounts in the bond's currency
 * for the face amount asked (spec section 14.1).
 */
export interface BondCalculationDto {
  bondId: string
  settlementDate: IsoDate
  cleanPrice: number
  /** Yield to maturity, compounded at the coupon frequency, in percent. */
  yieldPct: number
  /** Principal outstanding at settlement, per 100 of original face value. */
  outstandingPct: number
  /** Days from the last coupon to settlement (A) and days in the coupon period (E). */
  accruedDays: number
  periodDays: number
  accruedInterest: number
  dirtyPrice: number
  outstandingFace: number
  accruedAmount: number
  settlementAmount: number
  /** In years. */
  averageLife: number
  macaulayDuration: number
  modifiedDuration: number
  convexity: number
  /** Change in value for one basis point of yield. */
  dv01: number
  /**
   * The issuer country's curve at the average life. yieldPct and spreadBp are null when the
   * average life is outside the curve, which is not extrapolated.
   */
  curve: { country: string; date: IsoDate; yieldPct: number | null; spreadBp: number | null }
}
