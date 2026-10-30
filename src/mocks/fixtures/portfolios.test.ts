import { describe, expect, it } from 'vitest'
import { marketData, setSessionUser } from '../db'
import { portfolioValuation, positionsOf, riskOf } from '../lib/portfolioEngine'
import { createPortfolios } from './portfolios'

describe('sample portfolios', () => {
  // Quotes are delayed or not by the account type of the user logged in.
  setSessionUser('user-analyst')
  const market = marketData()

  it('end with the lines of the screen 5 mockup, the bonds in BVMAC nominals of 10,000', () => {
    const [fund] = createPortfolios('analyst', market)
    const valuation = portfolioValuation(fund, market)
    const positions = positionsOf(fund, valuation, market, new Date().toISOString())
    expect(
      Object.fromEntries(positions.items.map((item) => [item.securityId, item.quantity])),
    ).toEqual({
      SEMC: 2_300,
      BANGE: 5_200,
      SOCAPALM: 3_100,
      SAFACAM: 2_800,
      REGIONALE: 9_500,
      'SCG-RE': 5_400,
      SIAT: 4_100,
      'ECMR-6.25-2029': 15_000,
      'GAB-6.50-2028': 11_000,
    })
    // REGIONALE is above the 12% issuer limit, as in the mockup.
    const regionale = positions.items.find((item) => item.securityId === 'REGIONALE')
    expect(regionale?.weightPct).toBeGreaterThan(12)
    expect(riskOf(fund, valuation, positions, market).breaches).toContain('issuerWeightPct')
  })

  it('never hold less than no cash', () => {
    const [fund] = createPortfolios('manager', market)
    let cash = 0
    for (const transaction of fund.transactions) {
      cash += transaction.amount
      expect(cash).toBeGreaterThanOrEqual(0)
    }
  })

  it('only simulate for a Student and are none for employees', () => {
    expect(createPortfolios('student', market).map((portfolio) => portfolio.kind)).toEqual([
      'model',
      'model',
    ])
    expect(createPortfolios('admin', market)).toEqual([])
  })
})
