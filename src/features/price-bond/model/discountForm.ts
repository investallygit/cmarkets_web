import { rateAt, TENOR_YEARS } from '@/entities/bond'
import {
  STANDARD_TENORS,
  type BondDiscountDto,
  type CurvePointDto,
  type StandardTenor,
} from '@/shared/api/contracts'

/**
 * Block B of screen 16, "Discount rates" (spec section 9, fifth version): one yield; a curve of the
 * list; the rates the user enters, by cash-flow date or by standard tenor.
 */
export type DiscountChoice = 'yield' | 'curve' | 'rates'
export type RateEntry = 'dates' | 'tenors'

/** A remaining cash-flow date of the bond and its time in years from settlement. */
export interface ScheduleRow {
  date: string
  years: number
}

export interface DiscountForm {
  mode: DiscountChoice
  /** In yield mode: the clean price entered in place of the yield, whose yield is computed. */
  byPrice: boolean
  cleanPrice: number | null
  /** In curve mode: the curve chosen; CMarket's of the bond's country until one is. */
  curveId: string | null
  entry: RateEntry
  /** The rates entered by cash-flow date, in percent. */
  rates: Record<string, number | null>
  /** The rates entered by standard tenor, in percent; those left empty are not sent. */
  tenors: Record<StandardTenor, number | null>
}

/** The rates the server takes, in percent, bounds included. */
export const RATE_RANGE = [-5, 50] as const

/** The clean prices the server takes, per 100, bounds excluded. */
export const CLEAN_PRICE_RANGE = [0, 1000] as const

export function emptyTenors(): Record<StandardTenor, number | null> {
  return Object.fromEntries(STANDARD_TENORS.map((tenor) => [tenor, null])) as Record<
    StandardTenor,
    number | null
  >
}

/** As the screen opens: one yield, case A of section 14.1. */
export function defaultDiscount(): DiscountForm {
  return {
    mode: 'yield',
    byPrice: false,
    cleanPrice: null,
    curveId: null,
    entry: 'dates',
    rates: {},
    tenors: emptyTenors(),
  }
}

export function rateOutOfRange(rate: number | null): boolean {
  return rate !== null && (rate < RATE_RANGE[0] || rate > RATE_RANGE[1])
}

/** The tenors entered as points of a curve, by time. */
export function tenorPoints(tenors: DiscountForm['tenors']): CurvePointDto[] {
  return STANDARD_TENORS.flatMap((tenor) => {
    const ratePct = tenors[tenor]
    return ratePct === null ? [] : [{ tenor, years: TENOR_YEARS[tenor], ratePct }]
  })
}

/**
 * The rate block B shows on each cash-flow date: the yield on every row; the curve's rate read at
 * the date; the rate entered for the date; the tenors' rate read at the date, as the server will.
 */
export function shownRates(
  discount: DiscountForm,
  rows: readonly ScheduleRow[],
  context: { ytm: number | null; curve: readonly CurvePointDto[] | null },
): (number | null)[] {
  switch (discount.mode) {
    case 'yield':
      return rows.map(() => context.ytm)
    case 'curve':
      return rows.map((row) => (context.curve ? rateAt(context.curve, row.years) : null))
    case 'rates': {
      if (discount.entry === 'dates') return rows.map((row) => discount.rates[row.date] ?? null)
      const points = tenorPoints(discount.tenors)
      return rows.map((row) => rateAt(points, row.years))
    }
  }
}

/** Rates entered by date that cover each row: the table before, carried over. */
function ratesByDate(rows: readonly ScheduleRow[], shown: readonly (number | null)[]) {
  return Object.fromEntries(rows.map((row, index) => [row.date, shown[index] ?? null]))
}

const roundRate = (rate: number) => Math.round(rate * 1000) / 1000

/**
 * Block B switched to another mode: rates entered start from the table shown before (the curve's,
 * or the yield on every row) unless every date already has one; the tenors start from the curve
 * read at each tenor.
 */
export function switchDiscount(
  discount: DiscountForm,
  change: { mode: DiscountChoice; entry?: RateEntry },
  context: {
    rows: readonly ScheduleRow[]
    shown: readonly (number | null)[]
    /** The curve to read the tenors on: the one chosen, else CMarket's of the country. */
    curve: readonly CurvePointDto[] | null
  },
): DiscountForm {
  const next = { ...discount, mode: change.mode, entry: change.entry ?? discount.entry }
  if (next.mode !== 'rates') return next
  const covered =
    context.rows.length > 0 &&
    context.rows.every((row) => (discount.rates[row.date] ?? null) !== null)
  if (!covered) {
    next.rates = { ...discount.rates, ...ratesByDate(context.rows, context.shown) }
  }
  if (next.entry === 'tenors' && tenorPoints(discount.tenors).length === 0) {
    const base = context.curve?.length
      ? context.curve
      : context.rows.flatMap((row, index) => {
          const ratePct = context.shown[index]
          return ratePct === null || ratePct === undefined ? [] : [{ years: row.years, ratePct }]
        })
    next.tenors = Object.fromEntries(
      STANDARD_TENORS.map((tenor) => {
        const rate = rateAt(base, TENOR_YEARS[tenor])
        return [tenor, rate === null ? null : roundRate(rate)]
      }),
    ) as DiscountForm['tenors']
  }
  return next
}

/**
 * A rate of the table changed. From a curve, the rates become entered by date, the curve's on the
 * other rows (spec: "as soon as a rate is changed, the mode switches to Rates entered by
 * maturity").
 */
export function editRate(
  discount: DiscountForm,
  date: string,
  rate: number | null,
  context: { rows: readonly ScheduleRow[]; shown: readonly (number | null)[] },
): DiscountForm {
  const rates =
    discount.mode === 'curve' ? ratesByDate(context.rows, context.shown) : discount.rates
  return { ...discount, mode: 'rates', entry: 'dates', rates: { ...rates, [date]: rate } }
}

/**
 * The discount of POST /bonds/price for block B; undefined with one yield; null while incomplete:
 * a rate missing or out of range on a cash-flow date, no tenor entered.
 */
export function discountOf(
  discount: DiscountForm,
  dates: readonly string[] | null,
  defaultCurveId: string,
): BondDiscountDto | null | undefined {
  switch (discount.mode) {
    case 'yield':
      return undefined
    case 'curve':
      return { mode: 'curve', curveId: discount.curveId ?? defaultCurveId }
    case 'rates': {
      if (discount.entry === 'tenors') {
        const tenors = tenorPoints(discount.tenors)
        if (tenors.length === 0 || tenors.some((point) => rateOutOfRange(point.ratePct)))
          return null
        return {
          mode: 'tenors',
          tenors: tenors.map((point) => ({
            tenor: point.tenor as StandardTenor,
            ratePct: point.ratePct,
          })),
        }
      }
      if (!dates || dates.length === 0) return null
      const rates = dates.map((date) => ({ date, ratePct: discount.rates[date] ?? null }))
      if (rates.some((rate) => rate.ratePct === null || rateOutOfRange(rate.ratePct))) return null
      return {
        mode: 'rates',
        rates: rates.map((rate) => ({ date: rate.date, ratePct: rate.ratePct! })),
      }
    }
  }
}

/**
 * The points of the custom curve "Save as custom curve" keeps: the curve's own points; the rates
 * entered at their times; the tenors entered.
 */
export function pointsToSave(
  discount: DiscountForm,
  rows: readonly ScheduleRow[],
  shown: readonly (number | null)[],
  curve: readonly CurvePointDto[] | null,
): CurvePointDto[] {
  if (discount.mode === 'curve') return curve ? [...curve] : []
  if (discount.mode === 'rates' && discount.entry === 'tenors') return tenorPoints(discount.tenors)
  return rows.flatMap((row, index) => {
    const ratePct = shown[index]
    return ratePct === null || ratePct === undefined
      ? []
      : [{ tenor: null, years: row.years, ratePct }]
  })
}
