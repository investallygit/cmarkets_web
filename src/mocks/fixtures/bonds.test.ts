import { describe, expect, it } from 'vitest'
import { BOND_FIXTURES, cashFlows } from './bonds'

describe('bond cash flows', () => {
  it('repay 20% a year for the straight amortization of spec section 14.1, case B', () => {
    const flows = cashFlows(BOND_FIXTURES['ECMR-6.25-2029'])
    expect(flows.map((flow) => flow.date)).toEqual([
      '2025-11-04',
      '2026-11-04',
      '2027-11-04',
      '2028-11-04',
      '2029-11-04',
    ])
    expect(flows.map((flow) => flow.coupon)).toEqual([6.25, 5, 3.75, 2.5, 1.25])
    expect(flows.map((flow) => flow.amortization)).toEqual([20, 20, 20, 20, 20])
    expect(flows.map((flow) => flow.outstanding)).toEqual([80, 60, 40, 20, 0])
  })

  it('repay a bullet bond at maturity', () => {
    const flows = cashFlows(BOND_FIXTURES['GAB-6.50-2028'])
    expect(flows.map((flow) => flow.amortization)).toEqual([0, 0, 0, 0, 100])
    expect(flows.every((flow) => flow.coupon === 6.5)).toBe(true)
  })
})
