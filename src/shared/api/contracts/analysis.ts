import type { CurrencyCode } from './common'

/** Ratios computed by the server on the last annual accounts and the last price (spec section 3). */
export type RatioKey =
  'pe' | 'dividendYield' | 'priceToBook' | 'roe' | 'netDebtToEquity' | 'ebitdaMargin' | 'netMargin'

/** P/E, price-to-book and net debt / equity are multiples ("11.4x"); the others are percentages. */
export type Ratios = Record<RatioKey, number | null>

/** GET /securities/{id}/ratios: an equity's ratios and the averages of its sector. */
export interface RatiosDto {
  securityId: string
  sector: string
  /** Fiscal year of the accounts used. */
  fiscalYear: number
  ratios: Ratios
  /** Averages over the equities of the same sector that CMarket covers. */
  sectorAverages: Ratios
}

/** GET /analysis/compare?ids=SEMC,BANGE: one item per security, in the order asked. */
export interface ComparisonItemDto {
  securityId: string
  code: string
  name: string
  sector: string
  ratios: Ratios
}

export type FinancialStatement = 'income' | 'balance' | 'cashflow'

export type IncomeLineKey =
  'revenue' | 'ebitda' | 'operatingIncome' | 'netIncome' | 'eps' | 'netMargin' | 'roe'

export type BalanceLineKey =
  | 'totalAssets'
  | 'shareholdersEquity'
  | 'financialDebt'
  | 'cash'
  | 'netFinancialDebt'
  | 'bookValuePerShare'

export type CashFlowLineKey =
  'operatingCashFlow' | 'capitalExpenditure' | 'freeCashFlow' | 'dividendsPaid'

/** Line items of the "Financial statements" file of spec section 11 (line_item column). */
export type FinancialLineKey = IncomeLineKey | BalanceLineKey | CashFlowLineKey

/** Millions of the statement's currency, currency units per share, or percent. */
export type FinancialLineUnit = 'amount' | 'perShare' | 'percent'

export interface FinancialLineDto {
  key: FinancialLineKey
  unit: FinancialLineUnit
  /** One value per fiscal year of the statement, oldest first; null when not reported. */
  values: (number | null)[]
  /**
   * Over the years shown: compound annual growth rate in percent for amounts and per-share
   * figures, change in percentage points for percentages. Null when a value is missing, or
   * negative at either end.
   */
  growth: number | null
}

/** GET /securities/{id}/financials?statement=income|balance|cashflow&years=5 */
export interface FinancialStatementDto {
  securityId: string
  statement: FinancialStatement
  currency: CurrencyCode
  /** Oldest first. */
  fiscalYears: number[]
  lines: FinancialLineDto[]
}

/** Criteria on a list of values: the security's value is one of them. */
export type ScreenerListField = 'market' | 'country' | 'sector'

/**
 * Criteria on a figure. Market cap is in the security's currency, multiples in "x", the other
 * figures in percent; revenue growth is the compound annual growth over the last 5 years.
 */
export type ScreenerRangeField =
  | 'marketCap'
  | 'pe'
  | 'dividendYield'
  | 'roe'
  | 'netDebtToEquity'
  | 'change1y'
  | 'priceToBook'
  | 'netMargin'
  | 'revenueGrowth'
  | 'beta'

export type ScreenerField = ScreenerListField | ScreenerRangeField

/** Bounds are included; null leaves that side open. A security without the figure fails. */
export type ScreenerCriterionDto =
  | { field: ScreenerListField; values: string[] }
  | { field: ScreenerRangeField; min: number | null; max: number | null }

/** POST /analysis/screener: every criterion must hold. */
export interface ScreenerRequestDto {
  criteria: ScreenerCriterionDto[]
}

export interface ScreenerRowDto {
  securityId: string
  code: string
  name: string
  sector: string
  country: string
  currency: CurrencyCode
  last: number
  changePct: number
  isDelayed: boolean
  marketCap: number
  pe: number | null
  dividendYield: number | null
  roe: number | null
  netDebtToEquity: number | null
  change1y: number | null
  priceToBook: number | null
  netMargin: number | null
  revenueGrowth: number | null
  beta: number | null
}

export interface ScreenerResultDto {
  /** Equities of the markets asked, before the other criteria: "5 of 8 securities". */
  universe: number
  /** Largest market cap first. */
  items: ScreenerRowDto[]
}

/** GET /analysis/screens: the user's saved screens. */
export interface SavedScreenDto {
  id: string
  name: string
  criteria: ScreenerCriterionDto[]
}

/** POST /analysis/screens returns the SavedScreenDto created. */
export interface SavedScreenInputDto {
  name: string
  criteria: ScreenerCriterionDto[]
}
