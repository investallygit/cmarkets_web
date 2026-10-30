import { describe, expect, it } from 'vitest'
import { FUNDAMENTALS_BY_ID, lineGrowth, ratiosAt, revenueGrowth } from './fundamentals'

describe('fundamentals', () => {
  it('give the ratios of the screen 3 mockup at the mockup prices', () => {
    const semc = FUNDAMENTALS_BY_ID.get('SEMC')
    if (!semc) throw new Error('No SEMC accounts')
    expect(ratiosAt(semc, 52_500)).toMatchObject({
      pe: 11.4,
      dividendYield: 6.2,
      roe: 21.5,
      netDebtToEquity: 0.3,
      netMargin: 14,
    })
    const bange = FUNDAMENTALS_BY_ID.get('BANGE')
    if (!bange) throw new Error('No BANGE accounts')
    expect(ratiosAt(bange, 26_750)).toMatchObject({ pe: 7.9, dividendYield: 7.4, roe: 15.8 })
  })

  it('cover five fiscal years of every statement', () => {
    for (const fundamentals of FUNDAMENTALS_BY_ID.values()) {
      for (const lines of Object.values(fundamentals.statements)) {
        for (const line of lines) expect(line.values).toHaveLength(5)
      }
    }
  })

  it('grow SEMC revenue by 8.4% a year, as in the mockup', () => {
    const semc = FUNDAMENTALS_BY_ID.get('SEMC')
    expect(semc && revenueGrowth(semc)).toBe(8.4)
  })

  it('compute growth as a CAGR for amounts and in points for percentages', () => {
    expect(lineGrowth('amount', [100, 110, 121])).toBe(10)
    expect(lineGrowth('perShare', [-5, 10])).toBeNull()
    expect(lineGrowth('percent', [13.6, 14, 14.1])).toBe(0.5)
  })
})
