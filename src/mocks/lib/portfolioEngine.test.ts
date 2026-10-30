import { describe, expect, it } from 'vitest'
import { BOND_FIXTURES, cashFlows } from '../fixtures/bonds'
import {
  allocationOf,
  incomeOf,
  performanceOf,
  portfolioValuation,
  positionsOf,
  riskOf,
  transactionAmount,
  type MarketData,
  type StoredPortfolio,
  type StoredTransaction,
} from './portfolioEngine'

const DAYS = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']

/** A small market: SEMC and ECMR (spec section 14.1 case B) over one week. */
function testMarket(semc: number[], index: number[]): MarketData {
  const ecmr = BOND_FIXTURES['ECMR-6.25-2029']
  const closes: Record<string, number[]> = { SEMC: semc, 'ECMR-6.25-2029': DAYS.map(() => 101.4) }
  const inRange = (from: string, to: string) => DAYS.filter((day) => day >= from && day <= to)
  return {
    today: '2026-10-30',
    security: (id) =>
      id === 'SEMC'
        ? {
            id,
            code: 'SEMC',
            name: 'SEMC',
            type: 'equity',
            sector: 'Beverages',
            country: 'CM',
            currency: 'XAF',
            issuer: 'SEMC',
          }
        : id === ecmr.id
          ? {
              id,
              code: ecmr.code,
              name: ecmr.name,
              type: 'bond',
              sector: 'Sovereign',
              country: 'CM',
              currency: 'XAF',
              issuer: ecmr.issuer,
            }
          : undefined,
    quote: (id) => {
      const series = closes[id]
      return (
        series && { last: series[4], previousClose: series[3], tradedToday: true, isDelayed: false }
      )
    },
    closes: (id, from, to) =>
      new Map(inRange(from, to).map((day) => [day, closes[id][DAYS.indexOf(day)]])),
    quietDays: () => 0,
    bond: (id) => (id === ecmr.id ? { ...ecmr, schedule: cashFlows(ecmr) } : undefined),
    dividends: (id) =>
      id === 'SEMC' ? [{ exDate: '2026-11-10', paymentDate: '2026-11-24', amount: 3_000 }] : [],
    sessions: inRange,
    index: (code) => ({ code, name: 'BVMAC Equities' }),
    indexCloses: (_code, from, to) =>
      new Map(inRange(from, to).map((day) => [day, index[DAYS.indexOf(day)]])),
    fx: (from, to) => (from === to ? 1 : to === 'EUR' ? 1 / 655.957 : 655.957),
    riskFreeRatePct: 5,
  }
}

let nextId = 1
function transaction(
  fields: Partial<StoredTransaction> & Pick<StoredTransaction, 'type' | 'date'>,
): StoredTransaction {
  return {
    id: `tx-${nextId++}`,
    securityId: null,
    quantity: null,
    price: null,
    fees: 0,
    amount: 0,
    note: '',
    version: 1,
    ...fields,
  }
}

function portfolio(transactions: StoredTransaction[], currency = 'XAF'): StoredPortfolio {
  return {
    id: 'portfolio-test',
    name: 'Test',
    kind: 'real',
    currency,
    benchmark: 'BVMAC-A',
    limits: {
      issuerWeightPct: 50,
      volatilityPct: null,
      drawdownPct: null,
      beta: null,
      durationYears: null,
    },
    model: null,
    transactions,
    version: 1,
  }
}

describe('portfolio valuation, spec section 14.2', () => {
  const market = testMarket([50_000, 51_000, 50_000, 52_000, 52_500], [100, 101, 100, 102, 103])

  it('settles a trade with its fees, and a bond trade with its accrued interest', () => {
    const buy = {
      type: 'buy',
      date: '2026-10-26',
      securityId: 'SEMC',
      quantity: 100,
      price: 50_000,
      fees: 500,
      amount: null,
    } as const
    expect(transactionAmount(buy, 'XAF', market)).toBe(-5_000_500)
    expect(transactionAmount({ ...buy, type: 'sell' }, 'XAF', market)).toBe(4_999_500)
    expect(transactionAmount(buy, 'EUR', market)).toBeCloseTo(-5_000_500 / 655.957, 2)
    // 1,000 bonds of 10,000 at 80% outstanding, clean 101.40 + accrued 6.1644: spec case B.
    const bond = {
      ...buy,
      date: '2026-10-30',
      securityId: 'ECMR-6.25-2029',
      quantity: 1_000,
      price: 101.4,
      fees: 0,
    }
    expect(transactionAmount(bond, 'XAF', market)).toBeCloseTo(-8_605_150.68, 0)
  })

  it('values each session and neutralizes deposits in the time-weighted return', () => {
    const transactions = [
      transaction({ type: 'deposit', date: '2026-10-26', amount: 10_000_000 }),
      transaction({
        type: 'buy',
        date: '2026-10-26',
        securityId: 'SEMC',
        quantity: 100,
        price: 50_000,
        fees: 500,
        amount: -5_000_500,
      }),
      transaction({ type: 'deposit', date: '2026-10-28', amount: 1_000_000 }),
    ]
    const valuation = portfolioValuation(portfolio(transactions), market)
    expect(valuation.days).toEqual(DAYS)
    expect(valuation.values[0]).toBe(9_999_500)
    expect(valuation.values[2]).toBe(10_999_500)
    expect(valuation.flows).toEqual([10_000_000, 0, 1_000_000, 0, 0])
    const performance = performanceOf(portfolio(transactions), valuation, market, {
      from: null,
      to: null,
      benchmark: null,
    })
    // The deposit of the 28th is no gain: 100 shares moved from 50,000 to 52,500.
    expect(performance.twrPct).toBeCloseTo(
      ((10_099_500 / 9_999_500) * (10_999_500 / 11_099_500) * (11_249_500 / 10_999_500) - 1) * 100,
      8,
    )
    expect(performance.benchmarkPct).toBeCloseTo(3, 8)
    expect(performance.series.map((point) => point.benchmark)).toEqual([100, 101, 100, 102, 103])
    expect(performance.periods.map((period) => period.period)).toEqual([
      'day',
      'mtd',
      'ytd',
      'inception',
    ])
  })

  it('keeps the average cost, fees included, and the gain of a sale', () => {
    const transactions = [
      transaction({ type: 'deposit', date: '2026-10-26', amount: 20_000_000 }),
      transaction({
        type: 'buy',
        date: '2026-10-26',
        securityId: 'SEMC',
        quantity: 100,
        price: 50_000,
        fees: 500,
        amount: -5_000_500,
      }),
      transaction({
        type: 'buy',
        date: '2026-10-27',
        securityId: 'SEMC',
        quantity: 50,
        price: 53_000,
        fees: 300,
        amount: -2_650_300,
      }),
      transaction({
        type: 'sell',
        date: '2026-10-29',
        securityId: 'SEMC',
        quantity: 60,
        price: 54_000,
        fees: 400,
        amount: 3_239_600,
      }),
    ]
    const valuation = portfolioValuation(portfolio(transactions), market)
    const sale = transactions[3]
    // Spec section 14.2: average cost 51,005.33, realized gain 179,280.
    expect(valuation.holdings.get('SEMC')?.averageCost).toBeCloseTo(51_005.33, 2)
    expect(valuation.realizedById.get(sale.id)).toBeCloseTo(179_280, 2)
    const positions = positionsOf(
      portfolio(transactions),
      valuation,
      market,
      '2026-10-30T10:00:00Z',
    )
    const [semc] = positions.items
    expect(semc.quantity).toBe(90)
    expect(semc.unrealizedGain).toBeCloseTo(90 * (52_500 - 51_005.33), 0)
    expect(positions.totalValue).toBeCloseTo(positions.cash + 90 * 52_500, 2)
    expect(semc.weightPct + (positions.cash / positions.totalValue) * 100).toBeCloseTo(100, 8)
  })

  it('values a bond line on its principal outstanding, accrued interest included', () => {
    const transactions = [
      transaction({ type: 'deposit', date: '2026-10-26', amount: 20_000_000 }),
      transaction({
        type: 'buy',
        date: '2026-10-26',
        securityId: 'ECMR-6.25-2029',
        quantity: 1_000,
        price: 101.4,
        amount: -8_603_780.82,
      }),
    ]
    const valuation = portfolioValuation(portfolio(transactions), market)
    const positions = positionsOf(
      portfolio(transactions),
      valuation,
      market,
      '2026-10-30T10:00:00Z',
    )
    const [bond] = positions.items
    // 1,000 bonds × 10,000 × 80%: one point of price is worth 80,000.
    expect(bond.priceFactor).toBeCloseTo(80_000, 8)
    expect(bond.accrued).toBeCloseTo(493_150.68, 1)
    expect(bond.value).toBeCloseTo(101.4 * 80_000 + bond.accrued, 1)
    expect(bond.modifiedDuration).toBeCloseTo(1.3138, 4)
    const allocation = allocationOf(positions, 'maturity', market)
    expect(allocation.items.map((item) => item.key)).toEqual(['3-5', 'cash'])
  })

  it('reads "insufficient data" below 60 returns and checks the issuer limit', () => {
    const transactions = [
      transaction({ type: 'deposit', date: '2026-10-26', amount: 10_000_000 }),
      transaction({
        type: 'buy',
        date: '2026-10-26',
        securityId: 'SEMC',
        quantity: 150,
        price: 50_000,
        amount: -7_500_000,
      }),
    ]
    const valuation = portfolioValuation(portfolio(transactions), market)
    const positions = positionsOf(
      portfolio(transactions),
      valuation,
      market,
      '2026-10-30T10:00:00Z',
    )
    const risk = riskOf(portfolio(transactions), valuation, positions, market)
    expect(risk.observations).toBe(4)
    expect(risk.volatilityPct).toBeNull()
    expect(risk.beta).toBeNull()
    expect(risk.issuers[0].issuer).toBe('SEMC')
    expect(risk.breaches).toEqual(['issuerWeightPct'])
    expect(risk.hhi).toBeCloseTo((positions.items[0].weightPct / 100) ** 2, 10)
  })

  it('expects the dividends of the shares held on the ex-date', () => {
    const transactions = [
      transaction({ type: 'deposit', date: '2026-10-26', amount: 10_000_000 }),
      transaction({
        type: 'buy',
        date: '2026-10-26',
        securityId: 'SEMC',
        quantity: 100,
        price: 50_000,
        amount: -5_000_000,
      }),
      transaction({ type: 'dividend', date: '2026-10-27', securityId: 'SEMC', amount: 280_000 }),
    ]
    const valuation = portfolioValuation(portfolio(transactions), market)
    const income = incomeOf(portfolio(transactions), valuation, market)
    expect(income.received).toEqual([
      {
        date: '2026-10-27',
        securityId: 'SEMC',
        securityCode: 'SEMC',
        kind: 'dividend',
        income: 280_000,
        principal: 0,
      },
    ])
    expect(income.upcoming).toEqual([
      {
        date: '2026-11-24',
        securityId: 'SEMC',
        securityCode: 'SEMC',
        kind: 'dividend',
        income: 300_000,
        principal: 0,
      },
    ])
    expect(income.upcoming3Months).toBe(300_000)
  })
})
