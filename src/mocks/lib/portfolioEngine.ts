/**
 * The portfolio service of the fake back end: it replays a portfolio's transactions over the
 * price history and values it each session (spec section 14.2), then derives the positions,
 * performance, allocation, risk (14.3) and income the screen shows. Each part is a module of
 * ./portfolioEngine; this file is what the rest of the mock imports.
 */
export type {
  MarketData,
  MarketQuote,
  PortfolioBond,
  PortfolioSecurity,
  StoredPortfolio,
  StoredTransaction,
} from './portfolioEngine/model'
export { outstandingPct } from './portfolioEngine/units'
export {
  effectiveTransactions,
  incomeTransactions,
  transactionAmount,
  type TransactionFields,
} from './portfolioEngine/transactions'
export {
  portfolioValuation,
  positionsOf,
  valuePortfolio,
  type Valuation,
} from './portfolioEngine/valuation'
export { performanceOf } from './portfolioEngine/performance'
export { allocationOf } from './portfolioEngine/allocation'
export { MIN_OBSERVATIONS, riskOf } from './portfolioEngine/risk'
export { incomeOf } from './portfolioEngine/income'
