import type { AccountType, ModelAllocationDto, PortfolioLimitsDto } from '@/shared/api/contracts'
import {
  incomeTransactions,
  transactionAmount,
  type MarketData,
  type StoredPortfolio,
  type StoredTransaction,
  type TransactionFields,
} from '../lib/portfolioEngine'

type Fields = Omit<StoredTransaction, 'id' | 'version'>

const NO_LIMITS: PortfolioLimitsDto = {
  issuerWeightPct: null,
  volatilityPct: null,
  drawdownPct: null,
  beta: null,
  durationYears: null,
}

/** Brokerage and market fees, as a share of the amount traded. */
const EQUITY_FEES = 0.006
const BOND_FEES = 0.0025

interface SeedTrade {
  date: string
  type: 'buy' | 'subscription' | 'sell'
  securityId: string
  quantity: number
  /** A subscription is at its issue price; a trade at the session's close. */
  price?: number
}

/**
 * The fund of the screen 5 mockup, which ends with its quantities: equities bought in two
 * tranches, the two sovereign bonds subscribed at issue, part of the SIAT line sold. The
 * mockup's bonds are 1,500 and 1,100 bonds of XAF 100,000; BVMAC bonds have a nominal of
 * XAF 10,000, so the fund holds ten times as many.
 */
// prettier-ignore
const FUND_TRADES: SeedTrade[] = [
  { date: '2023-01-04', type: 'buy', securityId: 'SEMC', quantity: 1_400 },
  { date: '2023-01-04', type: 'buy', securityId: 'BANGE', quantity: 3_000 },
  { date: '2023-01-04', type: 'buy', securityId: 'SOCAPALM', quantity: 2_000 },
  { date: '2023-01-04', type: 'buy', securityId: 'SAFACAM', quantity: 1_800 },
  { date: '2023-01-04', type: 'buy', securityId: 'REGIONALE', quantity: 6_000 },
  { date: '2023-01-04', type: 'buy', securityId: 'SCG-RE', quantity: 3_400 },
  { date: '2023-01-04', type: 'buy', securityId: 'SIAT', quantity: 3_000 },
  { date: '2023-06-15', type: 'subscription', securityId: 'GAB-6.50-2028', quantity: 11_000, price: 100 },
  { date: '2024-04-03', type: 'buy', securityId: 'SEMC', quantity: 900 },
  { date: '2024-04-03', type: 'buy', securityId: 'BANGE', quantity: 2_200 },
  { date: '2024-04-03', type: 'buy', securityId: 'SOCAPALM', quantity: 800 },
  { date: '2024-04-03', type: 'buy', securityId: 'SAFACAM', quantity: 1_000 },
  { date: '2024-04-03', type: 'buy', securityId: 'REGIONALE', quantity: 3_500 },
  { date: '2024-04-03', type: 'buy', securityId: 'SCG-RE', quantity: 2_000 },
  { date: '2024-04-03', type: 'buy', securityId: 'SIAT', quantity: 2_000 },
  { date: '2024-11-04', type: 'subscription', securityId: 'ECMR-6.25-2029', quantity: 15_000, price: 100 },
  { date: '2025-09-10', type: 'sell', securityId: 'SIAT', quantity: 900 },
  { date: '2026-02-03', type: 'buy', securityId: 'SOCAPALM', quantity: 300 },
]

// prettier-ignore
const FUND_CASH: Fields[] = [
  { date: '2023-12-29', type: 'fees', securityId: null, quantity: null, price: null, fees: 0, amount: -1_200_000, note: 'Custody fees 2023' },
  { date: '2024-04-02', type: 'deposit', securityId: null, quantity: null, price: null, fees: 0, amount: 300_000_000, note: 'Second subscription to the fund' },
  { date: '2024-12-31', type: 'fees', securityId: null, quantity: null, price: null, fees: 0, amount: -1_500_000, note: 'Custody fees 2024' },
  { date: '2025-09-15', type: 'withdrawal', securityId: null, quantity: null, price: null, fees: 0, amount: -60_000_000, note: 'Redemption by a client' },
  { date: '2025-12-31', type: 'fees', securityId: null, quantity: null, price: null, fees: 0, amount: -1_800_000, note: 'Custody fees 2025' },
]

const LAUNCH_DATE = '2023-01-03'
/** Cash the fund holds today, the 6.8% of the mockup. */
const TARGET_CASH = 85_000_000

const FUND_LIMITS: PortfolioLimitsDto = {
  issuerWeightPct: 12,
  volatilityPct: 15,
  drawdownPct: 15,
  beta: 1.2,
  durationYears: 3,
}

/** Trades at the closing prices of the history, fees on top; then the income they earned. */
function fundTransactions(market: MarketData): StoredTransaction[] {
  const { today } = market
  const trades = FUND_TRADES.filter((trade) => trade.date <= today).flatMap((trade): Fields[] => {
    const security = market.security(trade.securityId)
    const price =
      trade.price ?? market.closes(trade.securityId, trade.date, trade.date).get(trade.date)
    if (!security || price === undefined) return []
    const rate = security.type === 'bond' ? BOND_FEES : EQUITY_FEES
    const fields: TransactionFields = {
      ...trade,
      price,
      fees: 0,
      amount: null,
    }
    // Fees on the amount traded, accrued interest aside.
    fields.fees = Math.round(Math.abs(transactionAmount(fields, 'XAF', market)) * rate)
    return [{ ...fields, amount: transactionAmount(fields, 'XAF', market), note: '' }]
  })
  const asStored = (fields: Fields, index: number): StoredTransaction => ({
    ...fields,
    id: `tx-${index + 1}`,
    version: 1,
  })
  const income = incomeTransactions(market, trades.map(asStored), 'XAF', LAUNCH_DATE, today)
  const others = [...trades, ...FUND_CASH.filter((move) => move.date <= today), ...income].sort(
    (a, b) => a.date.localeCompare(b.date),
  )

  // The launch deposit leaves the target in cash today and never less than nothing on the way.
  let cash = 0
  let lowest = 0
  for (const transaction of others) {
    cash += transaction.amount
    lowest = Math.min(lowest, cash)
  }
  const launch = Math.ceil(Math.max(TARGET_CASH - cash, -lowest) / 1_000_000) * 1_000_000
  const deposit: Fields = {
    date: LAUNCH_DATE,
    type: 'deposit',
    securityId: null,
    quantity: null,
    price: null,
    fees: 0,
    amount: launch,
    note: 'Fund launch',
  }
  return [deposit, ...others].map(asStored)
}

/** A model portfolio of the banks and the insurer, against the banks index. */
const BANKS_MODEL: ModelAllocationDto = {
  notional: 100_000_000,
  startDate: '2025-01-02',
  lines: [
    { securityId: 'BANGE', weightPct: 35 },
    { securityId: 'REGIONALE', weightPct: 35 },
    { securityId: 'SCG-RE', weightPct: 25 },
  ],
}

/** The fund's allocation as a Student simulates it. */
const STUDENT_MODEL: ModelAllocationDto = {
  notional: 10_000_000,
  startDate: '2025-01-02',
  lines: [
    { securityId: 'REGIONALE', weightPct: 12 },
    { securityId: 'BANGE', weightPct: 11 },
    { securityId: 'ECMR-6.25-2029', weightPct: 11 },
    { securityId: 'SOCAPALM', weightPct: 10 },
    { securityId: 'SEMC', weightPct: 10 },
    { securityId: 'SCG-RE', weightPct: 9.5 },
    { securityId: 'SAFACAM', weightPct: 9 },
    { securityId: 'GAB-6.50-2028', weightPct: 9 },
    { securityId: 'SIAT', weightPct: 6 },
  ],
}

/**
 * The portfolios a demo user starts with; Students only simulate; Journalists, CEOs and employees
 * hold none.
 */
export function createPortfolios(accountType: AccountType, market: MarketData): StoredPortfolio[] {
  if (['journalist', 'ceo', 'dataAdmin', 'admin'].includes(accountType)) return []
  const banks: StoredPortfolio = {
    id: 'portfolio-banks',
    name: 'Banks and insurers',
    kind: 'model',
    currency: 'XAF',
    benchmark: 'CMK-BANK',
    limits: { ...NO_LIMITS, volatilityPct: 20 },
    model: BANKS_MODEL,
    transactions: [],
    version: 1,
  }
  const fund: StoredPortfolio =
    accountType === 'student'
      ? {
          id: 'portfolio-cemac',
          name: 'CEMAC selection',
          kind: 'model',
          currency: 'XAF',
          benchmark: 'BVMAC-A',
          limits: { ...NO_LIMITS, issuerWeightPct: 12 },
          model: STUDENT_MODEL,
          transactions: [],
          version: 1,
        }
      : {
          id: 'portfolio-cemac',
          name: 'CEMAC Equity Fund',
          kind: 'real',
          currency: 'XAF',
          benchmark: 'BVMAC-A',
          limits: FUND_LIMITS,
          model: null,
          transactions: fundTransactions(market),
          version: 1,
        }
  return [fund, banks]
}
