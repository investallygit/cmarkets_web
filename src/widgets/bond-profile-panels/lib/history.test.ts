import { describe, expect, it } from 'vitest'
import type { BondAnalyticsDayDto } from '@/shared/api/contracts'
import { historyPoints, historySummary, periodStart } from './history'

const day = (date: string, overrides: Partial<BondAnalyticsDayDto> = {}): BondAnalyticsDayDto => ({
  date,
  priceSource: 'quote',
  cleanPrice: 101.4,
  dirtyPrice: 107.56,
  ytmPct: 5.73,
  ytwPct: 5.6,
  creditSpreadBp: 12,
  modifiedDuration: 2.53,
  volume: 1_200,
  ...overrides,
})

describe('the price and yield history of a bond (screen 20)', () => {
  it('starts each period so many months back, MAX at the issue', () => {
    expect(periodStart('6M', '2026-10-30', '2024-11-04')).toBe('2026-04-30')
    expect(periodStart('1Y', '2026-10-30', '2024-11-04')).toBe('2025-10-30')
    expect(periodStart('3Y', '2026-10-30', '2024-11-04')).toBe('2023-10-30')
    expect(periodStart('MAX', '2026-10-30', '2024-11-04')).toBe('2024-11-04')
  })

  it('draws the price with the YTM, the yields, or the spread alone', () => {
    const days = [day('2026-10-29'), day('2026-10-30', { cleanPrice: 101.45 })]
    expect(historyPoints(days, 'price').map((point) => [point.primary, point.secondary])).toEqual([
      [101.4, 5.73],
      [101.45, 5.73],
    ])
    expect(historyPoints(days, 'yield')[0]).toMatchObject({ primary: 5.73, secondary: 5.6 })
    expect(historyPoints(days, 'spread')[0]).toMatchObject({ primary: 12, secondary: null })
  })

  it('draws a model price lighter, without a volume bar on a day without a trade', () => {
    const [quoted, modelled] = historyPoints(
      [day('2026-10-29'), day('2026-10-30', { priceSource: 'model', volume: null })],
      'price',
    )
    expect([quoted.faint, quoted.volume]).toEqual([false, 1_200])
    expect([modelled.faint, modelled.volume]).toEqual([true, null])
  })

  it('sums up the period for screen readers, nothing without a value', () => {
    const points = historyPoints(
      [
        day('2026-10-28', { cleanPrice: null, priceSource: 'none', volume: null }),
        day('2026-10-29', { cleanPrice: 100.9, priceSource: 'model', volume: null }),
        day('2026-10-30', { cleanPrice: 101.4 }),
      ],
      'price',
    )
    expect(historySummary(points)).toEqual({
      from: '2026-10-28',
      to: '2026-10-30',
      first: 100.9,
      last: 101.4,
      low: 100.9,
      high: 101.4,
      traded: 1,
      model: 1,
    })
    expect(historySummary(historyPoints([day('2026-10-30', { cleanPrice: null })], 'price'))).toBe(
      null,
    )
  })
})
