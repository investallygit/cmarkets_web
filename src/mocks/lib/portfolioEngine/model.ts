import type {
  ModelAllocationDto,
  PortfolioKind,
  PortfolioLimitsDto,
  SecurityType,
  TransactionType,
} from '@/shared/api/contracts'
import type { BondTerms } from '../bondMath'

/** A portfolio as the service keeps it, and the market data the service reads. */

export interface StoredTransaction {
  id: string
  type: TransactionType
  date: string
  securityId: string | null
  quantity: number | null
  price: number | null
  fees: number
  /** Cash effect in the portfolio currency, signed, computed when recorded. */
  amount: number
  note: string
  version: number
}

export interface StoredPortfolio {
  id: string
  name: string
  kind: PortfolioKind
  currency: string
  benchmark: string
  limits: PortfolioLimitsDto
  model: ModelAllocationDto | null
  /** Empty for a model portfolio, whose transactions the server derives from its allocation. */
  transactions: StoredTransaction[]
  version: number
}

export interface PortfolioSecurity {
  id: string
  code: string
  name: string
  type: SecurityType
  sector: string
  country: string
  currency: string
  issuer: string
}

export interface PortfolioBond extends BondTerms {
  /** Face value of one bond. */
  nominal: number
}

export interface MarketQuote {
  last: number
  previousClose: number
  /** Traded in today's session; otherwise the price is carried forward ("stale price"). */
  tradedToday: boolean
  isDelayed: boolean
}

/** What the portfolio service reads from the market data of the fake back end. */
export interface MarketData {
  today: string
  security(id: string): PortfolioSecurity | undefined
  quote(id: string): MarketQuote | undefined
  /** Closing prices by day; today's is the last price once its session has opened. */
  closes(id: string, from: string, to: string): Map<string, number>
  /** Session days without a trade. */
  quietDays(id: string, from: string, to: string): number
  bond(id: string): PortfolioBond | undefined
  /** Dividends per share, paid or announced. */
  dividends(id: string): readonly { exDate: string; paymentDate: string; amount: number }[]
  /** Session days between two days, both included. */
  sessions(from: string, to: string): string[]
  index(code: string): { code: string; name: string } | undefined
  indexCloses(code: string, from: string, to: string): Map<string, number>
  /** Value of one unit of `from` in `to`; EUR / XAF is pegged at 655.957. */
  fx(from: string, to: string): number
  riskFreeRatePct: number
}
