import { describe, expect, it } from 'vitest'
import { monthTicks } from './monthTicks'

describe('monthTicks', () => {
  it('marks the first session of each quarter over a year', () => {
    const dates = [
      '2025-10-30',
      '2025-10-31',
      '2025-11-03',
      '2026-01-02',
      '2026-01-05',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
      '2026-10-30',
    ]
    expect(monthTicks(dates)).toEqual([
      '2025-10-30',
      '2026-01-02',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
    ])
  })

  it('marks every month over a short period, and nothing without dates', () => {
    expect(monthTicks(['2026-09-01', '2026-09-30', '2026-10-01', '2026-10-30'])).toEqual([
      '2026-09-01',
      '2026-10-01',
    ])
    expect(monthTicks([])).toEqual([])
  })
})
