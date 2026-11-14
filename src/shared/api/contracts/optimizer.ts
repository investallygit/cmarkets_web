import type { CurrencyCode, IsoDate, IsoDateTime } from './common'
import type { EtfGeography } from './etfs'

/**
 * Portfolio optimisation, OPT and OPT RES (spec section 9, screens 28 and 29; formulas of section
 * 14.6). Rates, weights and volatilities are in percent; amounts in XAF.
 */

/** The three kinds of security an optimisation holds: equities, bonds and ETFs. */
export type OptAssetClass = 'equity' | 'bond' | 'etf'

/** History of the estimates (spec screen 28's settings). */
export type OptHistory = '1y' | '3y' | '5y'

/** Returns of the estimates: weekly (Friday to Friday), or by session. */
export type OptFrequency = 'weekly' | 'daily'

/**
 * - `shortHistory`: under a year of prices: its volatility (and an equity's or an ETF's expected
 *   return) must be entered.
 * - `illiquid`: no quote in more than 30% of the weeks: its risk may be understated.
 * - `converted`: quoted in another currency, its returns are taken in XAF at the ECB's rates.
 * - `noPrice`: no price at all: its amount cannot be computed.
 */
export type OptEstimateFlag = 'shortHistory' | 'illiquid' | 'converted' | 'noPrice'

/** One security of POST /optimizer/estimates. */
export interface OptSecurityEstimateDto {
  securityId: string
  code: string
  name: string
  assetClass: OptAssetClass
  /** The issuer's country (ISO alpha-2) of an equity or a bond; null for an ETF. */
  country: string | null
  /** An ETF's market; null for an equity or a bond. */
  geography: EtfGeography | null
  currency: CurrencyCode
  /**
   * Annualised mean of the returns (equity, ETF) or the yield to maturity of the day's calculation
   * (bond, spec section 14.4); null when it cannot be estimated.
   */
  expectedReturnPct: number | null
  /** Annualised standard deviation of the returns, in XAF; null under a year of prices. */
  volatilityPct: number | null
  /** A bond's yield to maturity at its last price. */
  yieldPct: number | null
  /** A bond's modified duration at its last price, in years. */
  modifiedDuration: number | null
  /**
   * What one unit costs today, in XAF: a share at its last price, or a bond of its nominal at its
   * last price with its accrued interest (its minimum denomination). Null without a price.
   */
  unitPrice: number | null
  /** Returns the estimate was computed on. */
  observations: number
  /** Share of the weeks of the history without a quote, in percent. */
  missingWeeksPct: number
  flags: OptEstimateFlag[]
}

/** POST /optimizer/estimates: the securities in the order sent, 2 to 20. */
export interface OptEstimatesRequestDto {
  securityIds: string[]
  history: OptHistory
  frequency: OptFrequency
}

/** POST /optimizer/estimates (spec section 14.6, "Estimates"). */
export interface OptEstimatesDto {
  history: OptHistory
  frequency: OptFrequency
  /** The last session of the data. */
  dataDate: IsoDate
  /** The first day of the history. */
  from: IsoDate
  securities: OptSecurityEstimateDto[]
  /**
   * Correlations of the returns in XAF, shrunk towards a constant correlation (Ledoit-Wolf), in
   * the order of `securities`: `correlations[i][j]`, 1 on the diagonal. A security with too short
   * a history takes the average correlation of the others.
   */
  correlations: number[][]
  /** The shrinkage intensity, 0 (the sample's) to 1 (the constant correlation). */
  shrinkage: number
  /** The Admin's R_f, the 52-week BTA rate by default (spec section 14.3). */
  riskFreeRatePct: number
}

/** One security of an optimisation, with what the user entered in place of the estimates. */
export interface OptUniverseItemDto {
  securityId: string
  /** Entered by the user; null: the estimate. */
  expectedReturnPct: number | null
  /** Entered by the user; null: the estimate. */
  volatilityPct: number | null
  /** Bounds of its weight; null: 0, and the maximum per security. */
  minWeightPct: number | null
  maxWeightPct: number | null
}

/** A correlation entered by the user, in place of the estimate, between two securities. */
export interface OptCorrelationDto {
  a: string
  b: string
  value: number
}

/**
 * The four problems of spec section 14.6: A, the lowest risk for a minimum return; B, the highest
 * return for a maximum risk; C, the best return / risk ratio; D, the lowest risk.
 */
export type OptObjective = 'minRiskForReturn' | 'maxReturnForRisk' | 'maxSharpe' | 'minRisk'

export type OptGroupScope = 'assetClass' | 'country' | 'currency'

/**
 * A total per asset class (`equity`, `bond`, `etf`), country (an issuer's ISO alpha-2, or
 * `etf:<geography>` for the ETFs of a market) or currency (`XAF`, `USD`).
 */
export interface OptGroupConstraintDto {
  scope: OptGroupScope
  key: string
  minPct: number | null
  maxPct: number | null
}

/**
 * Everything an optimisation needs (screen 28). The whole capital is invested and nothing is sold
 * short: Σ w = 100%, every weight from its minimum, 0 at least (spec section 14.6).
 */
export interface OptSetupDto {
  universe: OptUniverseItemDto[]
  objective: OptObjective
  /** A: the minimum return wanted; B: the maximum volatility accepted. Null for C and D. */
  targetPct: number | null
  /** Maximum weight of any one security; null: none. */
  maxWeightPct: number | null
  groups: OptGroupConstraintDto[]
  correlations: OptCorrelationDto[]
  /** In XAF. */
  capital: number
  history: OptHistory
  frequency: OptFrequency
  /** Null: the Admin's. */
  riskFreeRatePct: number | null
  /** One of the user's portfolios, compared with the result and drawn on the frontier. */
  comparePortfolioId: string | null
}

export type OptCheckStatus = 'ok' | 'warning' | 'error'

/**
 * - `constraints`: the constraints can all hold (error: `constraints` names those involved).
 * - `target`: A's minimum return or B's maximum risk is within reach (error: out of it).
 * - `sharpe`: some security beats the risk-free rate, which C needs.
 * - `history`: every security has its estimates, entered or computed (error: `securityIds` lack one).
 * - `illiquid`: securities quoted too seldom, whose risk may be understated (a warning).
 * - `frequency`: daily returns asked with an illiquid security, which needs weekly ones (an error).
 * - `correlations`: the correlations entered make no possible matrix (an error).
 */
export type OptCheckCode =
  'constraints' | 'target' | 'sharpe' | 'history' | 'illiquid' | 'frequency' | 'correlations'

/** A constraint, as the check and the result name it. */
export type OptConstraintRefDto =
  | { kind: 'targetReturn'; valuePct: number }
  | { kind: 'targetRisk'; valuePct: number }
  | { kind: 'maxWeight'; valuePct: number; securityId: string | null }
  | { kind: 'securityMin'; securityId: string; valuePct: number }
  | { kind: 'securityMax'; securityId: string; valuePct: number }
  | { kind: 'groupMin'; scope: OptGroupScope; key: string; valuePct: number }
  | { kind: 'groupMax'; scope: OptGroupScope; key: string; valuePct: number }

export interface OptCheckItemDto {
  code: OptCheckCode
  status: OptCheckStatus
  /** The securities concerned. */
  securityIds: string[]
  /** The constraints involved in a conflict. */
  constraints: OptConstraintRefDto[]
}

export interface OptRangeDto {
  minPct: number
  maxPct: number
}

/** POST /optimizer/check: what stops a run, before it runs (spec section 9, screen 28). */
export interface OptCheckDto {
  /** No error: the run can go. */
  feasible: boolean
  /** Returns reachable under the constraints, from the lowest-risk allocation's to the highest. */
  returnRange: OptRangeDto | null
  /** Volatilities reachable, from the lowest-risk allocation's to the highest return's. */
  riskRange: OptRangeDto | null
  /** Securities with their estimates, entered or computed, out of the universe. */
  estimated: number
  items: OptCheckItemDto[]
  riskFreeRatePct: number
}

/** "max" or "min" where the weight sits at a limit. */
export type OptBound = 'min' | 'max'

export interface OptAllocationLineDto {
  securityId: string
  code: string
  name: string
  assetClass: OptAssetClass
  weightPct: number
  /** Whole securities the capital buys at the weight: shares, or bonds of their nominal. */
  quantity: number
  /** quantity × unit price; the rest of the weight stays in cash. */
  amount: number
  unitPrice: number | null
  /** RS_i = w_i (Σw)_i / σ_p²: the share of the portfolio's variance, the shares adding to 100. */
  riskSharePct: number
  bound: OptBound | null
  /** As used: entered, or estimated. */
  expectedReturnPct: number
  volatilityPct: number
}

export interface OptIndicatorsDto {
  expectedReturnPct: number
  volatilityPct: number
  /** (R_p − R_f) / σ_p; null when σ_p is 0. */
  sharpe: number | null
  /** 1.645 × σ_p / √252, in percent of the value. */
  var95Pct: number
  /** The VaR of the capital. */
  var95Amount: number
  /** Σ w_i × Dmod_i over the bonds, in years; null without a bond. */
  durationYears: number | null
  /** The bonds' yields to maturity weighted by their weights; null without a bond. */
  bondYieldPct: number | null
}

export interface OptPointDto {
  returnPct: number
  volatilityPct: number
}

export interface OptSecurityPointDto extends OptPointDto {
  securityId: string
  code: string
  assetClass: OptAssetClass
}

/** A portfolio placed beside the optimum: equal weights, or the user's. */
export interface OptComparedDto extends OptPointDto {
  sharpe: number | null
}

export interface OptPortfolioComparedDto extends OptComparedDto {
  portfolioId: string
  name: string
}

/**
 * The efficient frontier: problem A solved for 25 minimum returns from the lowest-risk
 * allocation's to the highest reachable, the securities, the optimum and the portfolios compared.
 */
export interface OptFrontierDto {
  /** By return, lowest first. */
  points: OptPointDto[]
  securities: OptSecurityPointDto[]
  optimal: OptPointDto
  /** Each security at 1 / n, whatever the constraints. */
  equalWeights: OptComparedDto
  /** The setup's portfolio, valued with the same estimates; its cash at the risk-free rate. */
  portfolio: OptPortfolioComparedDto | null
}

export interface OptBreakdownItemDto {
  key: string
  weightPct: number
  /** The limits the setup gave the group. */
  minPct: number | null
  maxPct: number | null
}

export interface OptBreakdownDto {
  assetClass: OptBreakdownItemDto[]
  /** An issuer's country, or `etf:<geography>` for the ETFs of a market. */
  country: OptBreakdownItemDto[]
  currency: OptBreakdownItemDto[]
}

/** POST /optimizer/run, POST /optimizer/frontier-point (screen 29). */
export interface OptResultDto {
  objective: OptObjective
  targetPct: number | null
  computedAt: IsoDateTime
  /** The last session of the data. */
  dataDate: IsoDate
  /** Time the calculation took, under 2 seconds for 20 securities. */
  durationMs: number
  /** Constraints set besides Σ w = 100% and no short sale. */
  constraintCount: number
  riskFreeRatePct: number
  capital: number
  indicators: OptIndicatorsDto
  /** Largest weight first; a security at 0 stays, at 0. */
  lines: OptAllocationLineDto[]
  /** What the rounding to whole securities leaves of the capital. */
  cash: number
  frontier: OptFrontierDto
  breakdown: OptBreakdownDto
  /** The constraints that hold with equality at the optimum. */
  binding: OptConstraintRefDto[]
}

/** POST /optimizer/frontier-point: the allocation of a point of the curve, the lowest risk for its return. */
export interface OptFrontierPointRequestDto {
  setup: OptSetupDto
  returnPct: number
}

/** GET /optimizer/scenarios: the user's, newest first. */
export interface OptScenarioSummaryDto {
  id: string
  name: string
  objective: OptObjective
  securities: number
  dataDate: IsoDate
  expectedReturnPct: number
  volatilityPct: number
  updatedAt: IsoDateTime
}

/**
 * GET /optimizer/scenarios/{id}: the setup, the result and its data date, as saved (spec section 9,
 * "Scenarios").
 */
export interface OptScenarioDto {
  id: string
  name: string
  setup: OptSetupDto
  result: OptResultDto
  dataDate: IsoDate
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  /** Row version, sent back with PUT; a 409 means the scenario changed meanwhile. */
  version: string
}

/**
 * POST /optimizer/scenarios saves a setup, computed on today's data (201, the scenario); PUT
 * /optimizer/scenarios/{id} computes it again on today's data, with the version read. A copy is a
 * POST of the setup under another name.
 */
export interface OptScenarioInputDto {
  name: string
  setup: OptSetupDto
  /** Required by PUT. */
  version?: string
}

/**
 * POST /optimizer/scenarios/{id}/to-portfolio: a model portfolio holding the allocation's weights
 * from today, or a real one with a deposit of the capital and the purchases of the allocation's
 * quantities at the last prices (a Student, model portfolios only). 201, the PortfolioDto.
 */
export interface OptToPortfolioDto {
  name: string
  kind: 'real' | 'model'
  /** Code of an index of GET /indices. */
  benchmark: string
}

export type OptTradeSide = 'buy' | 'sell' | 'hold'

export interface OptTradeDto {
  securityId: string
  code: string
  name: string
  side: OptTradeSide
  currentQuantity: number
  currentWeightPct: number
  targetWeightPct: number
  targetQuantity: number
  /** Securities to buy or sell. */
  quantity: number
  /** Their value at the last price, in XAF. */
  amount: number
}

/**
 * POST /optimizer/scenarios/{id}/rebalance?portfolioId=: the purchases and sales that would bring
 * the portfolio to the allocation, at the last prices, for information: CMarket sends no orders.
 */
export interface OptRebalanceDto {
  portfolioId: string
  portfolioName: string
  /** The portfolio's value in XAF, lines and cash: the base of the target weights. */
  totalValue: number
  asOf: IsoDate
  /** Sales first, then purchases, largest first. */
  trades: OptTradeDto[]
  buyAmount: number
  sellAmount: number
  /** The cash once every trade is made, the rounding's included. */
  cashAfter: number
}

export type OptExportFormat = 'xlsx' | 'pdf'
