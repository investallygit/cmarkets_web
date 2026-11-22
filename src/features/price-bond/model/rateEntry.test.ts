import { describe, expect, it } from 'vitest'
import { defaultDiscount, type DiscountForm, type ScheduleRow } from './discountForm'
import {
  clearRates,
  parsePasted,
  pasteRates,
  referenceOf,
  referenceRates,
  shiftRates,
  spreadBp,
  startFromCurve,
} from './rateEntry'

/** ECMR 6.25% 2029 settling on 30/10/2026: its four cash-flow dates (curve cases of 14.1). */
const ROWS: ScheduleRow[] = [
  { date: '2026-11-04', years: 0.0137 },
  { date: '2027-11-04', years: 1.0137 },
  { date: '2028-11-04', years: 2.0137 },
  { date: '2029-11-04', years: 3.0137 },
]
const CASE_B = [4.6, 5.1, 5.55, 5.85]
const CURVE = ROWS.map((row, index) => ({ tenor: null, years: row.years, ratePct: CASE_B[index]! }))
const FROM_CURVE: DiscountForm = { ...defaultDiscount(), mode: 'curve', curveId: 'custom-1' }
const context = { rows: ROWS, shown: CASE_B }

const ratesOf = (discount: DiscountForm) => ROWS.map((row) => discount.rates[row.date])

describe('the entry panel of block B (decision 46)', () => {
  it('compares with the curve chosen, the one the rates started from, else CMarket’s', () => {
    expect(referenceOf(FROM_CURVE, 'cmkt-CM')).toBe('custom-1')
    expect(referenceOf({ ...defaultDiscount(), mode: 'rates' }, 'cmkt-CM')).toBe('cmkt-CM')
    expect(referenceOf({ ...defaultDiscount(), mode: 'rates', referenceId: 'x' }, 'cmkt-CM')).toBe(
      'x',
    )
    expect(referenceRates(CURVE, ROWS).rows).toEqual(CASE_B)
    expect(referenceRates(CURVE, ROWS).tenors['2Y']).toBeCloseTo(5.5438, 4)
  })

  it('gives the spread in bp to one decimal, as case C over case B', () => {
    expect([4.8, 5.3, 5.7, 6].map((rate, index) => spreadBp(rate, CASE_B[index]!))).toEqual([
      20, 20, 15, 15,
    ])
    expect(spreadBp(5.1234, 5.1)).toBe(2.3)
    expect(spreadBp(null, 5)).toBeNull()
  })

  it('shifts every row from the curve: case C’s first two rates from case B', () => {
    const shifted = shiftRates(FROM_CURVE, 20, context)
    expect(shifted).toMatchObject({ mode: 'rates', entry: 'dates', referenceId: 'custom-1' })
    expect(ratesOf(shifted)).toEqual([4.8, 5.3, 5.75, 6.05])
    const tenors = shiftRates(
      {
        ...defaultDiscount(),
        mode: 'rates',
        entry: 'tenors',
        tenors: { ...defaultDiscount().tenors, '1Y': 5 },
      },
      -10,
      context,
    )
    expect(tenors.tenors['1Y']).toBe(4.9)
    expect(tenors.tenors['2Y']).toBeNull()
  })

  it('clears the rows and starts again from a curve, rounded as typed', () => {
    expect(ratesOf(clearRates(FROM_CURVE, context))).toEqual([null, null, null, null])
    const started = startFromCurve(
      { ...defaultDiscount(), mode: 'rates' },
      {
        id: 'cmkt-CM',
        points: [
          { tenor: '1Y', years: 1, ratePct: 5 },
          { tenor: '5Y', years: 5, ratePct: 6 },
        ],
      },
      ROWS,
    )
    expect(started.referenceId).toBe('cmkt-CM')
    expect(ratesOf(started)).toEqual([5, 5.003, 5.253, 5.503])
  })

  it('reads what Excel copies: a rate a line, or a date and a rate, in either language', () => {
    expect(parsePasted('Rate\n4,60\n5.1\n5.55 %\n\n')).toEqual({
      lines: [
        { date: null, rate: 4.6 },
        { date: null, rate: 5.1 },
        { date: null, rate: 5.55 },
      ],
      bad: [],
    })
    expect(parsePasted('04/11/2027\t5,3\r\n2028-11-04;5.7').lines).toEqual([
      { date: '2027-11-04', rate: 5.3 },
      { date: '2028-11-04', rate: 5.7 },
    ])
    expect(parsePasted('4.6\nabc\n31/02/2027\t5').bad).toEqual([2, 3])
  })

  it('pastes from the row in focus down, or by date, and changes nothing on a line unmatched', () => {
    const rates = { ...defaultDiscount(), mode: 'rates' as const }
    const down = pasteRates(rates, parsePasted('5.3\n5.7\n6').lines, { ...context, from: 1 })
    expect(down.unmatched).toBe(0)
    expect(ratesOf(down.discount)).toEqual([undefined, 5.3, 5.7, 6])
    const byDate = pasteRates(FROM_CURVE, parsePasted('04/11/2029\t6').lines, {
      ...context,
      from: 0,
    })
    expect(ratesOf(byDate.discount)).toEqual([4.6, 5.1, 5.55, 6])
    expect(pasteRates(rates, parsePasted('5\n5\n5').lines, { ...context, from: 2 }).unmatched).toBe(
      1,
    )
    expect(
      pasteRates(rates, parsePasted('04/12/2029\t6').lines, { ...context, from: 0 }).discount,
    ).toBe(rates)
  })
})
