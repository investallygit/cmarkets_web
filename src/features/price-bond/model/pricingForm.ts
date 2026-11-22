import { cmarketCurveId } from '@/entities/bond'
import {
  COUPON_FREQUENCIES,
  type BondDto,
  type BondPriceRequestDto,
  type CouponFrequency,
  type DayCount,
  type MarketYieldDto,
} from '@/shared/api/contracts'
import {
  CLEAN_PRICE_RANGE,
  defaultDiscount,
  discountOf,
  rateOutOfRange,
  tenorPoints,
  type DiscountForm,
} from './discountForm'

/** The face amount of the screen 16 mockup: XAF 100,000,000. */
export const DEFAULT_FACE_AMOUNT = 100_000_000

/** M at par: the principal repaid at 100 per 100 of face value. */
export const PAR = 100

/** The yields the server prices, in percent, bounds excluded (spec section 14.1). */
const YIELD_RANGE = [-50, 100] as const

/** The server's tolerance on a schedule's shares, which add up to 100%. */
const SCHEDULE_TOLERANCE = 0.01

/** The yield that reads the cash-flow dates: any yield gives the same dates. */
const SCHEDULE_YIELD = 5

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
  /** The country of the bond the form was filled from: its CMarket curve is block B's. */
  country: string
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
  /** Block B, "Discount rates" (fifth version): the yield, a curve, or rates entered. */
  discount: DiscountForm
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
    country: bond.country,
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
    discount: defaultDiscount(),
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

/** An input typed out of the range the API takes. */
export type RangeError = 'faceValue' | 'couponRate' | 'ytm' | 'cleanPrice' | 'rates'

/**
 * The inputs typed out of range, each said on its field (B54): a face value of 0 or below, a
 * coupon below 0 % or above 100 %, a yield past -50 % or 100 %. Calculate waited with
 * "Complete the inputs" and no field named. Block B's are those of its mode: a clean price of 0
 * or below or of 1,000 or above, a rate entered outside -5 % to 50 %.
 */
export function rangeErrors(form: PricingForm): ReadonlySet<RangeError> {
  const errors = new Set<RangeError>()
  const { discount } = form
  if (discount.mode === 'yield' && !discount.byPrice && form.ytm !== null) {
    if (form.ytm <= YIELD_RANGE[0] || form.ytm >= YIELD_RANGE[1]) errors.add('ytm')
  }
  if (discount.mode === 'yield' && discount.byPrice && discount.cleanPrice !== null) {
    const price = discount.cleanPrice
    if (price <= CLEAN_PRICE_RANGE[0] || price >= CLEAN_PRICE_RANGE[1]) errors.add('cleanPrice')
  }
  if (discount.mode === 'rates') {
    const rates =
      discount.entry === 'tenors'
        ? tenorPoints(discount.tenors).map((point) => point.ratePct)
        : Object.values(discount.rates)
    if (rates.some(rateOutOfRange)) errors.add('rates')
  }
  if (form.bondId) return errors
  if (form.faceValue !== null && form.faceValue <= 0) errors.add('faceValue')
  if (form.couponRate !== null && (form.couponRate < 0 || form.couponRate > 100))
    errors.add('couponRate')
  return errors
}

type BondInput = Omit<BondPriceRequestDto, 'settlementDate' | 'faceAmount'>

/** The bond of the request: a bond of the list by its id, else its characteristics. */
function bondOf(form: PricingForm): BondInput | null {
  if (form.bondId) return { bondId: form.bondId }
  const { faceValue, couponRate, maturityDate } = form
  if (faceValue === null || couponRate === null || !maturityDate) return null
  const bond: BondInput = {
    faceValue,
    couponRate,
    frequency: form.frequency,
    maturityDate,
    dayCount: form.dayCount,
  }
  if (form.redemption === 'bullet') return bond
  const rows = form.schedule.flatMap((row) =>
    row.date && row.pct !== null ? [{ date: row.date, pct: row.pct }] : [],
  )
  return rows.length === form.schedule.length && scheduleAddsUp(form.schedule)
    ? { ...bond, redemptionSchedule: rows }
    : null
}

/** What block B prices at: the yield, the clean price, or the discount rates. */
function pricedAt(
  form: PricingForm,
  dates: readonly string[] | null,
): Pick<BondPriceRequestDto, 'ytm' | 'cleanPrice' | 'discount'> | null {
  const { discount } = form
  if (discount.mode === 'yield') {
    if (discount.byPrice)
      return discount.cleanPrice === null ? null : { cleanPrice: discount.cleanPrice }
    return form.ytm === null ? null : { ytm: form.ytm }
  }
  const sent = discountOf(discount, dates, cmarketCurveId(form.country))
  return sent ? { discount: sent } : null
}

/**
 * POST /bonds/price for the form: the bond, the settlement, what block B prices at (the rates
 * entered by date need the cash-flow dates of the bond, `dates`), the face amount; null while a
 * field it needs is missing or out of range.
 */
export function toRequest(
  form: PricingForm,
  dates: readonly string[] | null = null,
): BondPriceRequestDto | null {
  const { settlementDate, faceAmount } = form
  if (!settlementDate || faceAmount === null || faceAmount <= 0) return null
  if (rangeErrors(form).size > 0) return null
  const bond = bondOf(form)
  const priced = pricedAt(form, dates)
  if (!bond || !priced) return null
  if (bond.bondId) return { bondId: bond.bondId, settlementDate, ...priced, faceAmount }
  const { redemptionSchedule, ...terms } = bond
  return {
    ...terms,
    settlementDate,
    ...priced,
    faceAmount,
    ...(redemptionSchedule ? { redemptionSchedule } : {}),
  }
}

/**
 * The request that reads the bond's remaining cash-flow dates for block B's table: the bond and
 * its settlement at a fixed yield and face amount, so that typing them asks nothing; null while
 * the bond is incomplete.
 */
export function scheduleRequest(form: PricingForm): BondPriceRequestDto | null {
  return toRequest({
    ...form,
    ytm: SCHEDULE_YIELD,
    faceAmount: DEFAULT_FACE_AMOUNT,
    discount: { ...form.discount, mode: 'yield', byPrice: false },
  })
}

/** Whether the figures shown are of other inputs than the form's. */
export function hasChanged(
  form: PricingForm,
  submitted: BondPriceRequestDto | null,
  dates: readonly string[] | null = null,
): boolean {
  return JSON.stringify(toRequest(form, dates)) !== JSON.stringify(submitted)
}
