import { describe, expect, it } from 'vitest'
import { BOND_FIXTURES, cashFlows } from '../fixtures/bonds'
import {
  accruedInterest,
  btaCompoundYield,
  calculateBond,
  dirtyPrice,
  interpolateCurve,
  settlementPeriod,
  yieldFromCleanPrice,
  type BondTerms,
} from './bondMath'

// Test cases of spec section 14.1: settlement 30/10/2026, annual coupon 6.25%, issued 04/11/2024,
// maturing 04/11/2029, ACT/ACT ICMA, clean price 101.40, XAF 100,000,000 of original face.
function testBond(amortization: 'bullet' | 'straight'): BondTerms {
  const terms = { ...BOND_FIXTURES['ECMR-6.25-2029'], amortization }
  return { ...terms, schedule: cashFlows(terms) }
}

const INPUT = { settlementDate: '2026-10-30', faceAmount: 100_000_000, cleanPrice: 101.4 }

describe('bond calculator, spec section 14.1', () => {
  it('matches case A, a bullet bond', () => {
    const result = calculateBond(testBond('bullet'), INPUT)
    expect(result.outstandingPct).toBe(100)
    expect([result.accruedDays, result.periodDays]).toEqual([360, 365])
    expect(result.accruedInterest).toBeCloseTo(6.1644, 4)
    expect(result.dirtyPrice).toBeCloseTo(107.5644, 4)
    expect(result.yieldPct).toBeCloseTo(5.7302, 4)
    expect(result.macaulayDuration).toBeCloseTo(2.6778, 4)
    expect(result.modifiedDuration).toBeCloseTo(2.5326, 4)
    expect(result.convexity).toBeCloseTo(9.419, 4)
    expect(result.averageLife).toBeCloseTo(3.0164, 4)
    expect(Math.round(result.settlementAmount)).toBe(107_564_384)
    expect(Math.round(result.dv01)).toBe(27_242)
  })

  it('matches case B, 20% of the principal repaid each year', () => {
    const result = calculateBond(testBond('straight'), INPUT)
    expect(result.outstandingPct).toBe(80)
    expect([result.accruedDays, result.periodDays]).toEqual([360, 365])
    expect(result.accruedInterest).toBeCloseTo(6.1644, 4)
    expect(result.dirtyPrice).toBeCloseTo(107.5644, 4)
    expect(result.yieldPct).toBeCloseTo(5.2419, 4)
    expect(result.macaulayDuration).toBeCloseTo(1.3827, 4)
    expect(result.modifiedDuration).toBeCloseTo(1.3138, 4)
    expect(result.convexity).toBeCloseTo(4.0913, 4)
    expect(result.averageLife).toBeCloseTo(1.5151, 4)
    expect(Math.round(result.settlementAmount)).toBe(86_051_507)
    expect(Math.round(result.dv01)).toBe(11_306)
  })

  it('goes back from the yield to the same clean price', () => {
    const bond = testBond('straight')
    const { yieldPct } = calculateBond(bond, INPUT)
    const result = calculateBond(bond, { ...INPUT, cleanPrice: undefined, yieldPct })
    expect(result.cleanPrice).toBeCloseTo(101.4, 8)
  })

  it('falls back to bisection, and fails when no yield fits', () => {
    const bond = testBond('bullet')
    const period = settlementPeriod(bond, INPUT.settlementDate)
    // From y0 = 6.25%, the first Newton step lands below −100%, where 1 + y/f is negative.
    const y = yieldFromCleanPrice(bond, period, 400)
    expect(y).toBeLessThan(-0.3)
    expect(dirtyPrice(bond, period, y) - accruedInterest(bond, period)).toBeCloseTo(400, 8)
    expect(() => yieldFromCleanPrice(bond, period, 1_000)).toThrow('noYield')
  })

  it('refuses a settlement before the issue or after the last payment', () => {
    const bond = testBond('bullet')
    expect(() => settlementPeriod(bond, '2024-01-15')).toThrow('beforeIssue')
    expect(() => settlementPeriod(bond, '2029-11-04')).toThrow('matured')
  })

  it('accrues nothing on a coupon date, which goes to the seller', () => {
    const period = settlementPeriod(testBond('straight'), '2026-11-04')
    expect(period.accruedDays).toBe(0)
    expect(period.outstanding).toBe(60)
    expect(period.flows).toHaveLength(3)
  })
})

describe('curves', () => {
  it('converts a BTA rate to an annual compound yield', () => {
    expect(btaCompoundYield(4.95, 182)).toBeCloseTo(5.0819, 4)
  })

  it('interpolates linearly between points, without extrapolating', () => {
    const points = [
      { years: 1, yieldPct: 5 },
      { years: 2, yieldPct: 6 },
    ]
    expect(interpolateCurve(points, 1.5)).toBeCloseTo(5.5, 10)
    expect(interpolateCurve(points, 2)).toBe(6)
    expect(interpolateCurve(points, 0.5)).toBeNull()
    expect(interpolateCurve(points, 3)).toBeNull()
  })
})
