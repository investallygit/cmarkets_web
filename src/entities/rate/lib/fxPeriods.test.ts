import { describe, expect, it } from 'vitest'
import { FX_PERIODS, fxPeriodRange } from './fxPeriods'

describe('fxPeriodRange', () => {
  // Wednesday 28 October 2026, 14:00 in Douala.
  const now = Date.UTC(2026, 9, 28, 13)

  it('asks each publication up to a year, each week beyond, every day for MAX', () => {
    expect(FX_PERIODS.map((period) => fxPeriodRange(period, now))).toEqual([
      { from: '2026-09-27', interval: '1d' },
      { from: '2026-04-28', interval: '1d' },
      { from: '2025-10-27', interval: '1d' },
      { from: '2021-10-24', interval: '1w' },
      { interval: '1w' },
    ])
  })

  it('counts the days of Douala, an hour ahead of UTC', () => {
    // 23:30 UTC on the 27th is already the 28th in Douala.
    expect(fxPeriodRange('1M', Date.UTC(2026, 9, 27, 23, 30)).from).toBe('2026-09-27')
  })
})
