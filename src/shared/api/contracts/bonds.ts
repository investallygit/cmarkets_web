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

/** GET /bonds/{id}: terms and cash-flow schedule. */
export interface BondDto {
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
  amortization: 'bullet' | 'straight'
  dayCount: DayCount
  /** Amount outstanding, in the bond's currency. */
  amountOutstanding: number
  schedule: BondCashFlowDto[]
}
