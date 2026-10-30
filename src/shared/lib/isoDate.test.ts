import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isoWeekday, isWeekend, startOfWeek } from './isoDate'

describe('ISO dates', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('finds the weekday and the Monday of the week', () => {
    expect(isoWeekday('2026-10-30')).toBe(5)
    expect(isoWeekday('2026-11-01')).toBe(7)
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26')
    expect(startOfWeek('2026-10-26')).toBe('2026-10-26')
    expect(isWeekend('2026-10-31')).toBe(true)
    expect(isWeekend('2026-11-02')).toBe(false)
  })

  it('lists the days of a range', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
    expect(daysBetween('2026-11-02', '2026-11-01')).toEqual([])
  })
})
