import { describe, expect, it } from 'vitest'
import type { EtfHistoryDayDto } from '@/shared/api/contracts'
import { growthPoints, historyQuery, lineSummary, pricePoints } from './history'

const day = (
  date: string,
  close: number,
  nav: number | null,
  volume: number,
): EtfHistoryDayDto => ({
  date,
  close,
  volume,
  nav,
  premiumDiscountPct: nav === null ? null : ((close - nav) / nav) * 100,
  totalReturn: null,
  index: null,
})

describe("screen 19's price history", () => {
  it('asks a period back from today by day, past three years by week, MAX from the inception', () => {
    expect(historyQuery('1Y', '2026-10-30', '2009-09-25', ['nav'])).toEqual({
      from: '2025-10-30',
      to: '2026-10-30',
      interval: '1d',
      with: ['nav'],
    })
    expect(historyQuery('5Y', '2026-10-30', null, []).interval).toBe('1w')
    expect(historyQuery('MAX', '2026-10-30', '2009-09-25', []).from).toBe('2009-09-25')
    // Without its inception, as far back as the API goes.
    expect(historyQuery('MAX', '2026-10-30', null, []).from).toBe('1976-10-30')
  })

  it('draws the price with the NAV beside it, the NAV alone when the price is off', () => {
    const days = [
      day('2026-10-28', 121.3, 121.25, 1_200_000),
      day('2026-10-29', 121.8, null, 1_400_000),
    ]

    expect(pricePoints(days, { price: true, nav: true, volume: true })).toEqual([
      { time: '2026-10-28', primary: 121.3, secondary: 121.25, faint: false, volume: 1_200_000 },
      { time: '2026-10-29', primary: 121.8, secondary: null, faint: false, volume: 1_400_000 },
    ])
    const navOnly = pricePoints(days, { price: false, nav: true, volume: false })
    expect(navOnly.map((point) => [point.primary, point.secondary, point.volume])).toEqual([
      [121.25, null, null],
      [null, null, null],
    ])
    expect(lineSummary(pricePoints(days, { price: true, nav: true, volume: true }))).toMatchObject({
      from: '2026-10-28',
      to: '2026-10-29',
      first: 121.3,
      last: 121.8,
      low: 121.3,
      high: 121.8,
      otherLast: 121.25,
    })
    expect(lineSummary([])).toBeNull()
  })

  it("draws PERF's total return and index from 100", () => {
    const days = [
      { ...day('2025-12-31', 100, null, 0), totalReturn: 100, index: 100 },
      { ...day('2026-10-29', 110, null, 0), totalReturn: 110.4, index: 110.5 },
    ]
    expect(growthPoints(days).map((point) => [point.primary, point.secondary])).toEqual([
      [100, 100],
      [110.4, 110.5],
    ])
  })
})
