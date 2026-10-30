import type {
  FinancialLineKey,
  FinancialLineUnit,
  FinancialStatement,
  Ratios,
} from '@/shared/api/contracts'
import { PROFILE_FIXTURES } from './profiles'
import { SECURITY_FIXTURES } from './securities'

export const FISCAL_YEARS = [2021, 2022, 2023, 2024, 2025] as const

interface FundamentalsFixture {
  /** Fiscal 2025, in percent. */
  roe: number
  netMargin: number
  ebitdaMargin: number
  operatingMargin: number
  netDebtToEquity: number
  /** Total assets over shareholders' equity. */
  assetsToEquity: number
  /** Compound annual growth from 2021 to 2025, in percent. */
  growth: {
    revenue: number
    ebitda: number
    operatingIncome: number
    netIncome: number
    totalAssets: number
    equity: number
    netDebt: number
    operatingCashFlow: number
  }
}

/**
 * Sample accounts of the BVMAC equities, not real figures. Fiscal 2025 earnings follow the P/E
 * of the profiles at the mockup prices, so the screener shows the mockup ratios; SEMC grows as
 * in the screen 3 mockup. The banks and the insurer carry little net debt (0.0x in the mockup).
 */
// prettier-ignore
const FUNDAMENTALS: Record<string, FundamentalsFixture> = {
  SEMC: { roe: 21.5, netMargin: 14, ebitdaMargin: 22, operatingMargin: 17, netDebtToEquity: 0.3, assetsToEquity: 1.75,
    growth: { revenue: 8.4, ebitda: 6.1, operatingIncome: 5.7, netIncome: 9.2, totalAssets: 5.2, equity: 7, netDebt: -3.1, operatingCashFlow: 6.4 } },
  SAFACAM: { roe: 14.1, netMargin: 12.8, ebitdaMargin: 24, operatingMargin: 18, netDebtToEquity: 0.4, assetsToEquity: 1.8,
    growth: { revenue: 5.2, ebitda: 4.8, operatingIncome: 4.5, netIncome: 6, totalAssets: 3.9, equity: 4.6, netDebt: 2, operatingCashFlow: 4.4 } },
  SOCAPALM: { roe: 18.2, netMargin: 16.5, ebitdaMargin: 30, operatingMargin: 23, netDebtToEquity: 0.6, assetsToEquity: 1.9,
    growth: { revenue: 6.8, ebitda: 7.5, operatingIncome: 7.9, netIncome: 8.8, totalAssets: 4.4, equity: 5.9, netDebt: -1.5, operatingCashFlow: 7 } },
  SIAT: { roe: 9.4, netMargin: 6.5, ebitdaMargin: 15, operatingMargin: 10, netDebtToEquity: 0.8, assetsToEquity: 2.2,
    growth: { revenue: 2.1, ebitda: -1.2, operatingIncome: -2.5, netIncome: -4, totalAssets: 1.5, equity: 1, netDebt: 6.5, operatingCashFlow: 0.5 } },
  BANGE: { roe: 15.8, netMargin: 30, ebitdaMargin: 45, operatingMargin: 40, netDebtToEquity: 0.02, assetsToEquity: 9.5,
    growth: { revenue: 9.5, ebitda: 9, operatingIncome: 9.8, netIncome: 11.2, totalAssets: 8.5, equity: 9, netDebt: 3, operatingCashFlow: 10 } },
  REGIONALE: { roe: 13, netMargin: 24, ebitdaMargin: 38, operatingMargin: 33, netDebtToEquity: 0.03, assetsToEquity: 11,
    growth: { revenue: 12.4, ebitda: 13, operatingIncome: 13.5, netIncome: 14.8, totalAssets: 11, equity: 10.5, netDebt: 4, operatingCashFlow: 12 } },
  'SCG-RE': { roe: 11.6, netMargin: 9.8, ebitdaMargin: 14, operatingMargin: 12.5, netDebtToEquity: 0.01, assetsToEquity: 3.4,
    growth: { revenue: 6, ebitda: 4.5, operatingIncome: 4, netIncome: 3.2, totalAssets: 5.5, equity: 4.8, netDebt: 2, operatingCashFlow: 5 } },
}

/**
 * Averages computed by the server over every equity of the sector it covers, not only the BVMAC
 * ones; Beverages has the 6.3% yield of the screen 3 mockup.
 */
// prettier-ignore
export const SECTOR_AVERAGES: Record<string, Ratios> = {
  Beverages: { pe: 12.1, dividendYield: 6.3, priceToBook: 2.2, roe: 19.4, netDebtToEquity: 0.35, ebitdaMargin: 21, netMargin: 12.9 },
  Agribusiness: { pe: 10.9, dividendYield: 5.7, priceToBook: 1.5, roe: 14.6, netDebtToEquity: 0.55, ebitdaMargin: 23.5, netMargin: 12.2 },
  Banking: { pe: 8.4, dividendYield: 6.6, priceToBook: 1.15, roe: 14.2, netDebtToEquity: 0.05, ebitdaMargin: 40, netMargin: 26 },
  Insurance: { pe: 9.6, dividendYield: 5.8, priceToBook: 1.1, roe: 12.4, netDebtToEquity: 0.02, ebitdaMargin: 15, netMargin: 10.5 },
}

/** Cash held, as a share of total assets; capital expenditure, as a share of revenue. */
const CASH_SHARE = 0.08
const CAPEX_SHARE = 0.07
const DIVIDEND_GROWTH = 5

export interface FinancialLine {
  key: FinancialLineKey
  unit: FinancialLineUnit
  values: number[]
}

export interface Fundamentals {
  sharesOutstanding: number
  /** Fiscal 2025, in XAF. */
  eps: number
  dividendPerShare: number
  statements: Record<FinancialStatement, FinancialLine[]>
}

/** 2021 to 2025 from the 2025 value and the yearly growth, in millions. */
function series(value2025: number, growthPct: number): number[] {
  return FISCAL_YEARS.map((year) => value2025 / (1 + growthPct / 100) ** (2025 - year))
}

const millions = (values: number[]) => values.map((value) => Math.round(value))
const ratio = (top: number[], bottom: number[]) =>
  top.map((value, index) => Number(((value / bottom[index]) * 100).toFixed(1)))

function buildFundamentals(id: string): Fundamentals | undefined {
  const fixture = FUNDAMENTALS[id]
  const security = SECURITY_FIXTURES.find((candidate) => candidate.id === id)
  const profile = PROFILE_FIXTURES[id]
  if (!fixture || !security || !profile?.sharesOutstanding || !profile.pe) return undefined
  const shares = profile.sharesOutstanding
  const { growth } = fixture
  const eps = Math.round(security.last / profile.pe)
  const dividendPerShare = Math.round(((profile.yieldPct ?? 0) * security.last) / 100)

  const netIncome = series((eps * shares) / 1e6, growth.netIncome)
  const revenue = series(netIncome[4] / (fixture.netMargin / 100), growth.revenue)
  const equity = series(netIncome[4] / (fixture.roe / 100), growth.equity)
  const totalAssets = series(equity[4] * fixture.assetsToEquity, growth.totalAssets)
  const netDebt = series(equity[4] * fixture.netDebtToEquity, growth.netDebt)
  const cash = totalAssets.map((value) => value * CASH_SHARE)
  const ebitda = series((revenue[4] * fixture.ebitdaMargin) / 100, growth.ebitda)
  const operatingCashFlow = series(ebitda[4] * 0.8, growth.operatingCashFlow)
  const capex = revenue.map((value) => value * CAPEX_SHARE)
  const dividendsPaid = series((dividendPerShare * shares) / 1e6, DIVIDEND_GROWTH)
  const perShare = (values: number[]) => values.map((value) => Math.round((value * 1e6) / shares))

  return {
    sharesOutstanding: shares,
    eps,
    dividendPerShare,
    statements: {
      income: [
        { key: 'revenue', unit: 'amount', values: millions(revenue) },
        {
          key: 'ebitda',
          unit: 'amount',
          values: millions(ebitda),
        },
        {
          key: 'operatingIncome',
          unit: 'amount',
          values: millions(
            series((revenue[4] * fixture.operatingMargin) / 100, growth.operatingIncome),
          ),
        },
        { key: 'netIncome', unit: 'amount', values: millions(netIncome) },
        { key: 'eps', unit: 'perShare', values: perShare(netIncome) },
        { key: 'netMargin', unit: 'percent', values: ratio(netIncome, revenue) },
        { key: 'roe', unit: 'percent', values: ratio(netIncome, equity) },
      ],
      balance: [
        { key: 'totalAssets', unit: 'amount', values: millions(totalAssets) },
        { key: 'shareholdersEquity', unit: 'amount', values: millions(equity) },
        {
          key: 'financialDebt',
          unit: 'amount',
          values: millions(netDebt.map((value, index) => value + cash[index])),
        },
        { key: 'cash', unit: 'amount', values: millions(cash) },
        { key: 'netFinancialDebt', unit: 'amount', values: millions(netDebt) },
        { key: 'bookValuePerShare', unit: 'perShare', values: perShare(equity) },
      ],
      cashflow: [
        { key: 'operatingCashFlow', unit: 'amount', values: millions(operatingCashFlow) },
        { key: 'capitalExpenditure', unit: 'amount', values: millions(capex) },
        {
          key: 'freeCashFlow',
          unit: 'amount',
          values: millions(operatingCashFlow.map((value, index) => value - capex[index])),
        },
        { key: 'dividendsPaid', unit: 'amount', values: millions(dividendsPaid) },
      ],
    },
  }
}

export const FUNDAMENTALS_BY_ID = new Map(
  Object.keys(FUNDAMENTALS).flatMap((id) => {
    const fundamentals = buildFundamentals(id)
    return fundamentals ? [[id, fundamentals] as const] : []
  }),
)

/**
 * Growth over the years shown, as the server computes it (spec section 14): compound annual
 * growth rate for amounts, change in percentage points for percentages.
 */
export function lineGrowth(unit: FinancialLineUnit, values: readonly number[]): number | null {
  const first = values.at(0)
  const last = values.at(-1)
  if (first === undefined || last === undefined || values.length < 2) return null
  if (unit === 'percent') return Number((last - first).toFixed(1))
  if (first <= 0 || last <= 0) return null
  return Number((((last / first) ** (1 / (values.length - 1)) - 1) * 100).toFixed(1))
}

function line(fundamentals: Fundamentals, key: FinancialLineKey): number[] {
  for (const lines of Object.values(fundamentals.statements)) {
    const found = lines.find((candidate) => candidate.key === key)
    if (found) return found.values
  }
  return []
}

const last = (values: number[]) => values.at(-1) ?? 0

/** Ratios at the given price, on the 2025 accounts. */
export function ratiosAt(fundamentals: Fundamentals, price: number): Ratios {
  const revenue = last(line(fundamentals, 'revenue'))
  const equity = last(line(fundamentals, 'shareholdersEquity'))
  const round = (value: number, decimals: number) => Number(value.toFixed(decimals))
  return {
    pe: fundamentals.eps > 0 ? round(price / fundamentals.eps, 1) : null,
    dividendYield: round((fundamentals.dividendPerShare / price) * 100, 1),
    priceToBook: round(price / last(line(fundamentals, 'bookValuePerShare')), 2),
    roe: last(line(fundamentals, 'roe')),
    netDebtToEquity: round(last(line(fundamentals, 'netFinancialDebt')) / equity, 1),
    ebitdaMargin: round((last(line(fundamentals, 'ebitda')) / revenue) * 100, 1),
    netMargin: last(line(fundamentals, 'netMargin')),
  }
}

/** Revenue growth over the five years, for the screener. */
export function revenueGrowth(fundamentals: Fundamentals): number | null {
  return lineGrowth('amount', line(fundamentals, 'revenue'))
}
