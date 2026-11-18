import { describe, expect, it } from 'vitest'
import type { ScreenerRowDto } from '@/shared/api/contracts'
import { liveRow } from './liveRow'

const semc: ScreenerRowDto = {
  securityId: 'SEMC',
  code: 'SEMC',
  name: 'Société des Eaux Minérales du Cameroun',
  sector: 'Food',
  country: 'CM',
  currency: 'XAF',
  last: 52500,
  changePct: 0,
  isDelayed: false,
  marketCap: 84.0e9,
  pe: 11.4,
  dividendYield: 6.2,
  roe: 18,
  netDebtToEquity: 0.2,
  change1y: 12,
  priceToBook: 2.1,
  netMargin: 9,
  revenueGrowth: 4,
  beta: 0.8,
}
const quote = { symbol: 'SEMC', change: 1000, volume: 120, ts: '2026-11-17T10:00:00Z' }

describe('liveRow (B95)', () => {
  it('moves the market cap, the P/E, the P/B and the yield with the live price', () => {
    const row = liveRow(semc, { ...quote, last: 53500, changePct: 1.9 })
    expect(row.last).toBe(53500)
    expect(row.changePct).toBe(1.9)
    // EQS read 84.0 Bn, 11.4x and 6.2 % beside DES's 85.6 Bn, 11.6x and 6.1 % at 53,500.
    expect(row.marketCap / 1e9).toBeCloseTo(85.6, 1)
    expect(row.pe).toBeCloseTo(11.62, 2)
    expect(row.dividendYield).toBeCloseTo(6.08, 2)
    expect(row.priceToBook).toBeCloseTo(2.14, 2)
    // What does not depend on the price stays.
    expect(row.roe).toBe(18)
    expect(row.change1y).toBe(12)
  })

  it('keeps a missing ratio missing, and the figures when the price has not moved', () => {
    const missing = liveRow(
      { ...semc, pe: null, dividendYield: null },
      { ...quote, last: 26250, changePct: -50 },
    )
    expect(missing.pe).toBeNull()
    expect(missing.dividendYield).toBeNull()
    expect(missing.marketCap).toBe(42.0e9)
    const same = liveRow(semc, { ...quote, last: 52500, changePct: 0.4 })
    expect(same).toEqual({ ...semc, changePct: 0.4 })
  })
})
