import { describe, expect, it } from 'vitest'
import { defaultDiscount, emptyTenors, type DiscountForm, type ScheduleRow } from './discountForm'
import { entryStatus } from './entryStatus'
import { referenceRates } from './rateEntry'

/** ECMR 6.25% 2029 settling on 30/10/2026: its four cash-flow dates (curve cases of 14.1). */
const ROWS: ScheduleRow[] = [
  { date: '2026-11-04', years: 0.0137 },
  { date: '2027-11-04', years: 1.0137 },
  { date: '2028-11-04', years: 2.0137 },
  { date: '2029-11-04', years: 3.0137 },
]
/** Case B, the CMarket curve of 29/10/2026 at the four dates; case C, the mockup's rate rise. */
const CASE_B = [4.6, 5.1, 5.55, 5.85]
const CASE_C = [4.8, 5.3, 5.7, 6]
const CURVE = ROWS.map((row, index) => ({ tenor: null, years: row.years, ratePct: CASE_B[index]! }))
const REFERENCES = referenceRates(CURVE, ROWS)

const entered = (rates: readonly (number | null)[]): DiscountForm => ({
  ...defaultDiscount(),
  mode: 'rates',
  rates: Object.fromEntries(ROWS.map((row, index) => [row.date, rates[index] ?? null])),
})

describe("block B's entry status (decision 56)", () => {
  it('reads the mockup: four rates, all within 0 to 30%, +17.5 bp on average, modified', () => {
    expect(entryStatus(entered(CASE_C), ROWS, REFERENCES)).toEqual({
      entered: 4,
      total: 4,
      missing: 0,
      outside: 0,
      averageSpread: 17.5,
      modified: true,
    })
  })

  it('says the rates are the curve’s while none is changed', () => {
    const status = entryStatus(entered(CASE_B), ROWS, REFERENCES)
    expect([status.averageSpread, status.modified]).toEqual([0, false])
  })

  it('counts the dates without a rate and the rates outside 0 to 30%', () => {
    const status = entryStatus(entered([4.8, null, 31, -0.5]), ROWS, REFERENCES)
    expect([status.entered, status.missing, status.outside]).toEqual([3, 1, 2])
  })

  it('counts the standard tenors, those left empty not missing', () => {
    const tenors = { ...emptyTenors(), '1Y': 5, '2Y': 5.6 }
    const status = entryStatus(
      { ...defaultDiscount(), mode: 'rates', entry: 'tenors', tenors },
      ROWS,
      REFERENCES,
    )
    expect([status.entered, status.total, status.missing]).toEqual([2, 8, 0])
  })

  it('has no average spread without a reference', () => {
    expect(entryStatus(entered(CASE_C), ROWS, null).averageSpread).toBeNull()
  })
})
