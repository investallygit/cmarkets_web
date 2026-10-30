import { describe, expect, it } from 'vitest'
import { meetsCriterion, readCriteria, type ScreenerValues } from './screener'

const SEMC: ScreenerValues = {
  market: 'BVMAC',
  country: 'CM',
  sector: 'Beverages',
  marketCap: 84e9,
  pe: 11.4,
  dividendYield: 6.2,
  roe: 21.5,
  netDebtToEquity: 0.3,
  change1y: 8.1,
  priceToBook: 2.45,
  netMargin: 14,
  revenueGrowth: 8.4,
  beta: null,
}

describe('screener criteria', () => {
  it('keep a security whose value is in the list or within the bounds', () => {
    expect(meetsCriterion(SEMC, { field: 'country', values: ['CM', 'GA'] })).toBe(true)
    expect(meetsCriterion(SEMC, { field: 'sector', values: ['Banking'] })).toBe(false)
    expect(meetsCriterion(SEMC, { field: 'pe', min: 5, max: 15 })).toBe(true)
    expect(meetsCriterion(SEMC, { field: 'pe', min: 5, max: 11.4 })).toBe(true)
    expect(meetsCriterion(SEMC, { field: 'roe', min: 25, max: null })).toBe(false)
  })

  it('drop a security without the figure', () => {
    expect(meetsCriterion(SEMC, { field: 'beta', min: null, max: 1 })).toBe(false)
  })

  it('reject unknown fields and inverted bounds', () => {
    expect(readCriteria([{ field: 'pe', min: 5, max: null }])).toEqual({
      criteria: [{ field: 'pe', min: 5, max: null }],
    })
    expect(readCriteria([{ field: 'colour', values: ['red'] }])).toHaveProperty('errors')
    expect(readCriteria([{ field: 'pe', min: 15, max: 5 }])).toEqual({
      errors: { 'criteria[0]': ['The minimum is above the maximum.'] },
    })
    expect(readCriteria('pe > 5')).toHaveProperty('errors')
  })
})
