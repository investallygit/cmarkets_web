import { describe, expect, it } from 'vitest'
import {
  defaultCriteria,
  fromSaved,
  isRunnable,
  rangeValue,
  readRange,
  toQuery,
  toSaved,
} from './criteria'

describe('the bond screener criteria', () => {
  it('start as the mockup: above 5%, duration 0 to 5, six years of maturities, XAF', () => {
    expect(toQuery(defaultCriteria(2026))).toEqual({
      pageSize: 200,
      ytmMin: 5,
      durationMin: 0,
      durationMax: 5,
      maturityFrom: '2026-01-01',
      maturityTo: '2032-12-31',
      currency: 'XAF',
    })
  })

  it('send the categories and markets only when a box is unticked', () => {
    const query = toQuery({
      ...defaultCriteria(2026),
      categories: ['sovereign', 'supranational'],
      markets: ['beac'],
    })
    expect(query.issuerCategory).toBe('sovereign,supranational,regional')
    expect(query.market).toBe('beac')
  })

  it('come back from a saved screen as they were saved', () => {
    const criteria = {
      ...defaultCriteria(2026),
      categories: ['supranational' as const],
      ratingMin: 'BBB-',
      couponType: 'fixed' as const,
    }
    expect(fromSaved(toSaved(criteria))).toEqual(criteria)
    expect(fromSaved(toSaved(defaultCriteria(2026)))).toEqual(defaultCriteria(2026))
  })

  it('need a category and a market to run', () => {
    expect(isRunnable({ ...defaultCriteria(2026), markets: [] })).toBe(false)
    expect(isRunnable(defaultCriteria(2026))).toBe(true)
  })

  it('write a pair of bounds as one value of a drop-down', () => {
    expect(rangeValue(0, 5)).toBe('0:5')
    expect(rangeValue(10, null)).toBe('10:')
    expect(rangeValue(null, null)).toBe('')
    expect(readRange('10:')).toEqual([10, null])
    expect(readRange('')).toEqual([null, null])
  })
})
