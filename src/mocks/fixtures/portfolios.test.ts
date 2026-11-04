import { describe, expect, it } from 'vitest'
import { marketData, setSessionUser } from '../db'
import { portfolioValuation, positionsOf, riskOf } from '../lib/portfolioEngine'
import { createPortfolios } from './portfolios'

describe('sample portfolios', () => {
  // Quotes are delayed or not by the account type of the user logged in.
  setSessionUser('user-analyst')
  const market = marketData()

  it('end with the lines of the screen 5 mockup, the bonds in BVMAC nominals of 10,000', () => {
    const [fund] = createPortfolios({ id: 'user-analyst', accountType: 'analyst' }, market)
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
    const [fund] = createPortfolios({ id: 'user-manager', accountType: 'manager' }, market)
    let cash = 0
    for (const transaction of fund.transactions) {
      cash += transaction.amount
      expect(cash).toBeGreaterThanOrEqual(0)
    }
  })

  it('only simulate for a Student and are none for employees', () => {
    const student = createPortfolios({ id: 'user-student', accountType: 'student' }, market)
    expect(student.map((portfolio) => portfolio.kind)).toEqual(['model', 'model'])
    expect(createPortfolios({ id: 'user-admin', accountType: 'admin' }, market)).toEqual([])
  })

  it('share the fund of P. Owona with the organisation, and no other', () => {
    const shared = (id: string) =>
      createPortfolios({ id, accountType: 'manager' }, market).map((portfolio) => [
        portfolio.id,
        portfolio.sharedWithOrganization,
      ])
    expect(shared('user-manager')).toEqual([
      ['portfolio-cemac', true],
      ['portfolio-banks', false],
    ])
    // Another manager's carry the user's id: a colleague lists them beside the user's own.
    expect(shared('user-x')).toEqual([
      ['portfolio-cemac-user-x', false],
      ['portfolio-banks-user-x', false],
    ])
  })
})
