import { describe, expect, it } from 'vitest'
import {
  defaultDiscount,
  discountOf,
  editRate,
  pointsToSave,
  shownRates,
  switchDiscount,
  type DiscountForm,
  type ScheduleRow,
} from './discountForm'

/** ECMR 6.25% 2029 settling on 30/10/2026: its four cash-flow dates (curve cases of 14.1). */
const ROWS: ScheduleRow[] = [
  { date: '2026-11-04', years: 0.0137 },
  { date: '2027-11-04', years: 1.0137 },
  { date: '2028-11-04', years: 2.0137 },
  { date: '2029-11-04', years: 3.0137 },
]
const DATES = ROWS.map((row) => row.date)

/** The CMarket Cameroon curve of the mockup at those dates (curve case B). */
const CURVE = ROWS.map((row, index) => ({
  tenor: null,
  years: row.years,
  ratePct: [4.6, 5.1, 5.55, 5.85][index]!,
}))

const YIELD = defaultDiscount()
const FROM_CURVE: DiscountForm = { ...YIELD, mode: 'curve', curveId: 'cmkt-CM' }

describe('block B of bond pricing, "Discount rates" (spec screen 16, fifth version)', () => {
  it('shows the yield on every row, the curve read at each date, or the rates entered', () => {
    expect(shownRates(YIELD, ROWS, { ytm: 5.7302, curve: null })).toEqual([
      5.7302, 5.7302, 5.7302, 5.7302,
    ])
    expect(shownRates(FROM_CURVE, ROWS, { ytm: 5.7302, curve: CURVE })).toEqual([
      4.6, 5.1, 5.55, 5.85,
    ])
    expect(shownRates(FROM_CURVE, ROWS, { ytm: 5.7302, curve: null })).toEqual([
      null,
      null,
      null,
      null,
    ])
  })

  it('shows the tenors interpolated to the cash-flow dates, as the server reads them', () => {
    const tenors: DiscountForm = {
      ...YIELD,
      mode: 'rates',
      entry: 'tenors',
      tenors: { ...YIELD.tenors, '3M': 4.6, '1Y': 5.1, '2Y': 5.55, '3Y': 5.85, '5Y': 6.2 },
    }

    expect(
      shownRates(tenors, ROWS, { ytm: null, curve: null }).map((rate) => rate?.toFixed(4)),
    ).toEqual(['4.6000', '5.1062', '5.5541', '5.8524'])
    expect(discountOf(tenors, null, 'cmkt-CM')).toEqual({
      mode: 'tenors',
      tenors: [
        { tenor: '3M', ratePct: 4.6 },
        { tenor: '1Y', ratePct: 5.1 },
        { tenor: '2Y', ratePct: 5.55 },
        { tenor: '3Y', ratePct: 5.85 },
        { tenor: '5Y', ratePct: 6.2 },
      ],
    })
  })

  it('turns a curve into rates entered as soon as one rate changes', () => {
    const shown = shownRates(FROM_CURVE, ROWS, { ytm: null, curve: CURVE })
    const edited = editRate(FROM_CURVE, '2029-11-04', 6, { rows: ROWS, shown })

    expect(edited).toMatchObject({ mode: 'rates', entry: 'dates' })
    expect(discountOf(edited, DATES, 'cmkt-CM')).toEqual({
      mode: 'rates',
      rates: [
        { date: '2026-11-04', ratePct: 4.6 },
        { date: '2027-11-04', ratePct: 5.1 },
        { date: '2028-11-04', ratePct: 5.55 },
        { date: '2029-11-04', ratePct: 6 },
      ],
    })
  })

  it('starts the rates entered from the table shown and the tenors from the curve', () => {
    const shown = shownRates(YIELD, ROWS, { ytm: 5.73, curve: null })
    const byDate = switchDiscount(YIELD, { mode: 'rates' }, { rows: ROWS, shown, curve: null })
    const byTenor = switchDiscount(
      YIELD,
      { mode: 'rates', entry: 'tenors' },
      { rows: ROWS, shown, curve: CURVE },
    )

    expect(DATES.map((date) => byDate.rates[date])).toEqual([5.73, 5.73, 5.73, 5.73])
    expect(byTenor.tenors).toMatchObject({ '3M': 4.718, '1Y': 5.093, '2Y': 5.544, '5Y': 5.85 })
    // Rates the user entered stay through a visit to another mode.
    const entered = { ...byDate, rates: { ...byDate.rates, '2029-11-04': 6 } }
    const back = switchDiscount(
      { ...entered, mode: 'yield' },
      { mode: 'rates' },
      { rows: ROWS, shown, curve: null },
    )
    expect(back.rates['2029-11-04']).toBe(6)
  })

  it('sends nothing while a date has no rate, a rate is out of range or no tenor is entered', () => {
    const rates: DiscountForm = { ...YIELD, mode: 'rates', rates: { '2026-11-04': 4.8 } }

    expect(discountOf(YIELD, DATES, 'cmkt-CM')).toBeUndefined()
    expect(discountOf({ ...YIELD, mode: 'curve' }, DATES, 'cmkt-GA')).toEqual({
      mode: 'curve',
      curveId: 'cmkt-GA',
    })
    expect(discountOf(rates, DATES, 'cmkt-CM')).toBeNull()
    expect(discountOf(rates, null, 'cmkt-CM')).toBeNull()
    const full = { ...rates, rates: Object.fromEntries(DATES.map((date) => [date, 60])) }
    expect(discountOf(full, DATES, 'cmkt-CM')).toBeNull()
    expect(discountOf({ ...YIELD, mode: 'rates', entry: 'tenors' }, DATES, 'cmkt-CM')).toBeNull()
  })

  it('saves the curve, the rates entered at their times or the tenors entered', () => {
    const shown = [4.8, 5.3, 5.7, 6]
    const rates: DiscountForm = { ...YIELD, mode: 'rates' }

    expect(pointsToSave(FROM_CURVE, ROWS, shown, CURVE)).toEqual(CURVE)
    expect(pointsToSave(rates, ROWS, shown, null)).toEqual(
      ROWS.map((row, index) => ({ tenor: null, years: row.years, ratePct: shown[index] })),
    )
    const tenors = { ...rates, entry: 'tenors' as const, tenors: { ...YIELD.tenors, '1Y': 5 } }
    expect(pointsToSave(tenors, ROWS, shown, null)).toEqual([{ tenor: '1Y', years: 1, ratePct: 5 }])
  })
})
