import { describe, expect, it } from 'vitest'
import { stepDate, visibleRange } from './calendarView'

describe('calendar range', () => {
  it('shows Monday to Sunday in the week view', () => {
    expect(visibleRange({ view: 'week', date: '2026-10-30' })).toEqual({
      from: '2026-10-26',
      to: '2026-11-01',
    })
    expect(visibleRange({ view: 'day', date: '2026-10-30' })).toEqual({
      from: '2026-10-30',
      to: '2026-10-30',
    })
  })

  it('moves by a day or a week', () => {
    expect(stepDate({ view: 'day', date: '2026-10-30' }, 1)).toBe('2026-10-31')
    expect(stepDate({ view: 'week', date: '2026-10-30' }, -1)).toBe('2026-10-23')
  })
})
