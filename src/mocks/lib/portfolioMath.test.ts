import { describe, expect, it } from 'vitest'
import {
  annualize,
  annualizedReturn,
  beta,
  buyLot,
  chainReturns,
  dailyReturns,
  herfindahl,
  historicalVar,
  maxDrawdown,
  moneyWeightedReturn,
  sampleStdDev,
  sellGain,
  trackingError,
  valueIndex,
  volatility,
} from './portfolioMath'

describe('performance, spec section 14.2', () => {
  it('neutralizes deposits and withdrawals in the time-weighted return', () => {
    // Day 0 to 3: flows at the start of the day, values at the end.
    const returns = dailyReturns(
      [1_000_000, 1_020_000, 1_540_000, 1_330_000],
      [0, 0, 500_000, -200_000],
    )
    expect(returns.map((r) => Number((r * 100).toFixed(4)))).toEqual([2, 1.3158, -0.7463])
    expect(chainReturns(returns) * 100).toBeCloseTo(2.5709, 4)
  })

  it('keeps the weighted average cost, fees included', () => {
    let lot = buyLot({ quantity: 0, averageCost: 0 }, 100, 50_000, 500)
    lot = buyLot(lot, 50, 53_000, 300)
    expect(lot.averageCost).toBeCloseTo(51_005.33, 2)
    expect(sellGain(lot, 60, 54_000, 400)).toBeCloseTo(179_280, 6)
    expect((lot.quantity - 60) * (52_500 - lot.averageCost)).toBeCloseTo(134_520, 6)
  })

  it('spreads the fees of a bond over its principal outstanding', () => {
    // 1,000 bonds of 10,000 at 80% outstanding: 8,000,000 of principal, fees of 8,000 = 0.1 point.
    const lot = buyLot({ quantity: 0, averageCost: 0 }, 1_000, 100, 8_000, 80)
    expect(lot.averageCost).toBeCloseTo(100.1, 10)
    expect(sellGain(lot, 1_000, 101, 0, 80)).toBeCloseTo(72_000, 6)
  })

  it('annualizes only beyond a year', () => {
    expect(annualize(0.1, 365)).toBeNull()
    expect(annualize(0.21, 730)).toBeCloseTo(0.1, 10)
  })

  it('finds the money-weighted return of the flows', () => {
    // 1,000,000 then 500,000 after half a year, 1,600,000 a year after the start.
    const irr = moneyWeightedReturn(1_000_000, [{ days: 182.5, amount: 500_000 }], 1_600_000, 365)
    expect(irr).not.toBeNull()
    const rate = irr ?? 0
    const npv = -1_000_000 - 500_000 * (1 + rate) ** -0.5 + 1_600_000 / (1 + rate)
    expect(npv).toBeCloseTo(0, 4)
    expect(moneyWeightedReturn(1_000_000, [], 1_100_000, 365)).toBeCloseTo(0.1, 8)
  })
})

describe('risk metrics, spec section 14.3', () => {
  // The test case of the spec: A = 252, R_f = 5%, the 60-observation threshold disabled.
  const portfolio = [0.4, -0.2, 0.6, -1.0, 0.3, 0.5, -0.4, 0.8, -0.6, 0.2].map((r) => r / 100)
  const index = [0.3, -0.1, 0.4, -0.8, 0.2, 0.4, -0.3, 0.6, -0.4, 0.1].map((r) => r / 100)

  it('matches the expected results', () => {
    expect(sampleStdDev(portfolio) * 100).toBeCloseTo(0.5835, 4)
    const sigma = volatility(portfolio, 252)
    expect(sigma * 100).toBeCloseTo(9.2624, 4)
    expect(maxDrawdown(valueIndex(portfolio)).value * 100).toBeCloseTo(-1, 4)
    expect(beta(portfolio, index)).toBeCloseTo(1.3357, 4)
    expect(chainReturns(portfolio) * 100).toBeCloseTo(0.5862, 4)
    const annual = annualizedReturn(portfolio, 252)
    expect(annual * 100).toBeCloseTo(15.8691, 4)
    expect((annual - 0.05) / sigma).toBeCloseTo(1.1735, 4)
    expect(trackingError(portfolio, index, 252) * 100).toBeCloseTo(2.4593, 4)
    expect(historicalVar(portfolio) * 100).toBeCloseTo(0.82, 4)
  })

  it('dates the drawdown from its peak to its trough', () => {
    const drawdown = maxDrawdown([100, 110, 99, 105, 120, 96, 130])
    expect(drawdown.value).toBeCloseTo(-0.2, 10)
    expect([drawdown.peak, drawdown.trough]).toEqual([4, 5])
    expect(maxDrawdown([100, 101, 102])).toEqual({ value: 0, peak: -1, trough: -1 })
  })

  it('measures concentration', () => {
    expect(herfindahl([0.5, 0.3, 0.2])).toBeCloseTo(0.38, 10)
  })
})
