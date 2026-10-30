import { describe, expect, it } from 'vitest'
import type { PositionDto, PositionsDto } from '@/shared/api/contracts'
import { valueAtPrices, withLiveDay } from './liveValuation'

const line = (fields: Partial<PositionDto>): PositionDto => ({
  securityId: 'SEMC',
  code: 'SEMC',
  name: 'SEMC',
  type: 'equity',
  sector: 'Beverages',
  country: 'CM',
  issuer: 'SEMC',
  currency: 'XAF',
  quantity: 100,
  averageCost: 50_000,
  price: 52_000,
  previousClose: 52_000,
  isStale: false,
  isDelayed: false,
  priceFactor: 100,
  accrued: 0,
  value: 5_200_000,
  unrealizedGain: 200_000,
  unrealizedPct: 4,
  weightPct: 52,
  modifiedDuration: null,
  ...fields,
})

const positions: PositionsDto = {
  portfolioId: 'portfolio-test',
  currency: 'XAF',
  asOf: '2026-10-30T10:00:00Z',
  items: [
    line({}),
    // 1,000 bonds of 10,000 at 80% outstanding: 80,000 per point, plus the accrued interest.
    line({
      securityId: 'ECMR-6.25-2029',
      type: 'bond',
      averageCost: 100,
      price: 101.4,
      priceFactor: 80_000,
      accrued: 493_150.68,
      modifiedDuration: 1.31,
    }),
  ],
  cash: 1_000_000,
  totalValue: 14_805_150.68,
  previousValue: 14_700_000,
  realizedGain: 0,
}

describe('valueAtPrices', () => {
  it('moves the values, gains and weights to the live prices', () => {
    const live = valueAtPrices(positions, [52_500, undefined])
    const [semc, bond] = live.items
    expect(semc.value).toBe(5_250_000)
    expect(semc.unrealizedGain).toBe(250_000)
    expect(semc.unrealizedPct).toBeCloseTo(5, 10)
    expect(bond.value).toBeCloseTo(101.4 * 80_000 + 493_150.68, 6)
    expect(live.totalValue).toBeCloseTo(1_000_000 + 5_250_000 + bond.value, 6)
    expect(semc.weightPct + bond.weightPct + live.cashWeightPct).toBeCloseTo(100, 10)
    expect(live.dayChange).toBeCloseTo(live.totalValue - 14_700_000, 6)
    expect(live.dayChangePct).toBeCloseTo((live.dayChange / 14_700_000) * 100, 10)
  })
})

describe('withLiveDay', () => {
  it("chains the live day onto the period's return before today", () => {
    // +10% to yesterday, then +1% today instead of the +0.5% of the server's valuation.
    const period = (1.1 * 1.005 - 1) * 100
    expect(withLiveDay(period, 0.5, 1)).toBeCloseTo((1.1 * 1.01 - 1) * 100, 10)
    expect(withLiveDay(period, 0.5, 0.5)).toBeCloseTo(period, 10)
  })
})
