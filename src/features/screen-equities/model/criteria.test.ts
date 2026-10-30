import { describe, expect, it } from 'vitest'
import type { ScreenerCriterionDto } from '@/shared/api/contracts'
import {
  defaultCriteria,
  fromRequestCriteria,
  hasInvertedBounds,
  isActive,
  toRequestCriteria,
  type CriterionState,
} from './criteria'

// The criteria of the screen 3 mockup.
const HIGH_YIELD: ScreenerCriterionDto[] = [
  { field: 'market', values: ['BVMAC'] },
  { field: 'marketCap', min: 10e9, max: null },
  { field: 'pe', min: 5, max: 15 },
  { field: 'dividendYield', min: 5, max: null },
  { field: 'roe', min: 12, max: null },
  { field: 'netDebtToEquity', min: null, max: 1 },
]

describe('screener criteria', () => {
  it('start with every equity of BVMAC', () => {
    expect(toRequestCriteria(defaultCriteria())).toEqual([{ field: 'market', values: ['BVMAC'] }])
  })

  it('round-trip a saved screen, market cap typed in billions', () => {
    const criteria = fromRequestCriteria(HIGH_YIELD)
    expect(criteria.find((criterion) => criterion.field === 'marketCap')).toEqual({
      field: 'marketCap',
      operator: 'above',
      min: 10,
      max: null,
    })
    expect(criteria.find((criterion) => criterion.field === 'pe')).toMatchObject({
      operator: 'between',
    })
    expect(toRequestCriteria(criteria)).toEqual(HIGH_YIELD)
  })

  it('add the criteria a saved screen uses beyond the nine of the mockup', () => {
    const criteria = fromRequestCriteria([{ field: 'beta', min: null, max: 0.8 }])
    expect(criteria.map((criterion) => criterion.field).at(-1)).toBe('beta')
    expect(criteria.find((criterion) => criterion.field === 'market')).toEqual({
      field: 'market',
      value: '',
    })
  })

  it('leave out incomplete or inverted ranges', () => {
    const above: CriterionState = { field: 'roe', operator: 'above', min: null, max: null }
    const inverted: CriterionState = { field: 'pe', operator: 'between', min: 15, max: 5 }
    expect(isActive(above)).toBe(false)
    expect(hasInvertedBounds(inverted)).toBe(true)
    expect(isActive(inverted)).toBe(false)
    expect(toRequestCriteria([above, inverted])).toEqual([])
  })
})
