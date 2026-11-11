import {
  COUPON_FREQUENCIES,
  type BondDto,
  type BondPriceRequestDto,
  type CouponFrequency,
  type DayCount,
  type MarketYieldDto,
} from '@/shared/api/contracts'

/** The face amount of the screen 16 mockup: XAF 100,000,000. */
export const DEFAULT_FACE_AMOUNT = 100_000_000

/** M at par: the principal repaid at 100 per 100 of face value. */
export const PAR = 100

/** The yields the server prices, in percent, bounds excluded (spec section 14.1). */
const YIELD_RANGE = [-50, 100] as const

/** The server's tolerance on a schedule's shares, which add up to 100%. */
const SCHEDULE_TOLERANCE = 0.01

export type RedemptionKind = 'bullet' | 'amortizing'

/** A repayment of the schedule entered: the share of the original face repaid on a date, in percent. */
export interface RedemptionRow {
  date: string | null
  pct: number | null
}

/** Blocks A and B of screen 16, as the user edits them. */
export interface PricingForm {
  /** The bond of the list these are the characteristics of; null once one was changed by hand. */
  bondId: string | null
  /** The currency of the amounts: the one of the bond the form was filled from. */
  currency: string
  /** M, per 100 of face value. */
  faceValue: number | null
  /** C, annual, in percent. */
  couponRate: number | null
  frequency: CouponFrequency
  maturityDate: string | null
  settlementDate: string | null
  dayCount: DayCount
  redemption: RedemptionKind
  schedule: RedemptionRow[]
  /** In percent, compounded at the coupon frequency. */
  ytm: number | null
  faceAmount: number | null
}

/** The fields of block A: changing one makes the bond one entered by hand. */
export type Characteristic =
  'faceValue' | 'couponRate' | 'frequency' | 'maturityDate' | 'dayCount' | 'redemption' | 'schedule'

export function frequencyOf(value: number): CouponFrequency {
  return COUPON_FREQUENCIES.find((frequency) => frequency === value) ?? 1
}

/** The shares of its original face a bond of the list repays on each date: none for a bullet bond. */
export function redemptionsOf(bond: BondDto): RedemptionRow[] {
  if (bond.amortization === 'bullet') return []
  return bond.schedule
    .filter((flow) => flow.amortization > 0)
    .map((flow) => ({ date: flow.date, pct: Math.round(flow.amortization * 10_000) / 10_000 }))
}

/**
 * A bond of the list at the platform's yield, settling as its market does, for a face amount: the
 * figures of screen 16 as it opens.
 */
export function formOf(
  bond: BondDto,
  market: MarketYieldDto,
  faceAmount: number | null = DEFAULT_FACE_AMOUNT,
): PricingForm {
  const schedule = redemptionsOf(bond)
  return {
    bondId: bond.id,
    currency: bond.currency,
    faceValue: PAR,
    couponRate: bond.couponPct,
    frequency: frequencyOf(bond.frequency),
    maturityDate: bond.maturityDate,
    settlementDate: market.settlementDate,
    dayCount: bond.dayCount,
    redemption: schedule.length > 0 ? 'amortizing' : 'bullet',
    schedule,
    ytm: market.ytmPct,
    faceAmount,
  }
}

/** The shares entered, added up, in percent. */
export function scheduleTotal(rows: readonly RedemptionRow[]): number {
  return rows.reduce((total, row) => total + (row.pct ?? 0), 0)
}

/** Whether the shares add up to 100%, as the server checks them. */
export function scheduleAddsUp(rows: readonly RedemptionRow[]): boolean {
  return rows.length > 0 && Math.abs(scheduleTotal(rows) - 100) <= SCHEDULE_TOLERANCE
}

/** The first repayment after the last one, a year later; at maturity for the first. */
export function nextRepayment(form: PricingForm): RedemptionRow {
  const last = form.schedule.at(-1)?.date
  const date = last ? `${Number(last.slice(0, 4)) + 1}${last.slice(4)}` : form.maturityDate
  return { date, pct: form.schedule.length === 0 ? 100 : null }
}

/**
 * POST /bonds/price for the form: a bond of the list by its id, else its characteristics; null
 * while a field it needs is missing or out of range.
 */
export function toRequest(form: PricingForm): BondPriceRequestDto | null {
  const { settlementDate, ytm, faceAmount } = form
  if (!settlementDate || faceAmount === null || faceAmount <= 0) return null
  if (ytm === null || ytm <= YIELD_RANGE[0] || ytm >= YIELD_RANGE[1]) return null
  if (form.bondId) return { bondId: form.bondId, settlementDate, ytm, faceAmount }

  const { faceValue, couponRate, maturityDate } = form
  if (faceValue === null || faceValue <= 0 || couponRate === null || couponRate < 0) return null
  if (!maturityDate) return null
  const request: BondPriceRequestDto = {
    faceValue,
    couponRate,
    frequency: form.frequency,
    maturityDate,
    settlementDate,
    dayCount: form.dayCount,
    ytm,
    faceAmount,
  }
  if (form.redemption === 'bullet') return request
  const rows = form.schedule.flatMap((row) =>
    row.date && row.pct !== null ? [{ date: row.date, pct: row.pct }] : [],
  )
  return rows.length === form.schedule.length && scheduleAddsUp(form.schedule)
    ? { ...request, redemptionSchedule: rows }
    : null
}

/** Whether the figures shown are of other inputs than the form's. */
export function hasChanged(form: PricingForm, submitted: BondPriceRequestDto | null): boolean {
  return JSON.stringify(toRequest(form)) !== JSON.stringify(submitted)
}
