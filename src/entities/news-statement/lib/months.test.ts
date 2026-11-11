import { describe, expect, it } from 'vitest'
import { isMonth, monthOf, monthsUpTo, previousMonth, shiftMonth } from './months'

describe('statement months', () => {
  it('finds the month a day belongs to and the one before', () => {
    expect(monthOf('2026-11-11')).toBe('2026-11')
    expect(previousMonth('2026-11-11')).toBe('2026-10')
    expect(previousMonth('2026-01-31')).toBe('2025-12')
  })

  it('moves a month and lists the months of a selector, the latest first', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-03', -1)).toBe('2026-02')
    expect(monthsUpTo('2026-11', 3)).toEqual(['2026-11', '2026-10', '2026-09'])
  })

  it('tells a month from anything else', () => {
    expect(isMonth('2026-10')).toBe(true)
    expect(isMonth('2026-13')).toBe(false)
    expect(isMonth('2026-1')).toBe(false)
    expect(isMonth(null)).toBe(false)
  })
})
