import type { CurrencyCode, IsoDate, IsoDateTime } from './common'
import type { SecurityType } from './securities'

/**
 * Real: valued from its transactions. Model: an allocation simulated without transactions, the
 * only kind a Student account may hold (spec section 4).
 */
export type PortfolioKind = 'real' | 'model'

/**
 * User-defined limits, checked after each valuation (spec section 14.3); null: no limit. A
 * breach shows in red with the limit below and sets off the user's portfolio alerts.
 */
export interface PortfolioLimitsDto {
  /** Largest weight of one issuer, in percent of the value ("more than 10% on one issuer"). */
  issuerWeightPct: number | null
  /** Annualized volatility, in percent. */
  volatilityPct: number | null
  /** Deepest fall accepted, in percent: 15 means a drawdown below −15% is a breach. */
  drawdownPct: number | null
  beta: number | null
  /** Modified duration of the bond sleeve, in years. */
  durationYears: number | null
}

export type PortfolioLimit = keyof PortfolioLimitsDto

/** One line of a model portfolio: its share of the notional at the start date. */
export interface ModelLineDto {
  securityId: string
  weightPct: number
}

/**
 * A model portfolio buys its lines at the closing prices of the start date and holds them;
 * dividends, coupons and redemptions go to cash. Weights add up to 100 at most, the rest is cash.
 */
export interface ModelAllocationDto {
  /** In the portfolio currency. */
  notional: number
  startDate: IsoDate
  lines: ModelLineDto[]
}

/** GET /portfolios: the user's portfolios, limited in number by the account type (GET /me). */
export interface PortfolioSummaryDto {
  id: string
  name: string
  kind: PortfolioKind
  /** Reference currency: XAF or EUR (pegged at 655.957). */
  currency: CurrencyCode
  /** Code of an index of GET /indices, e.g. "BVMAC-A". */
  benchmark: string
  /** Date of the first valuation; null before the first transaction. */
  inceptionDate: IsoDate | null
}

/** GET /portfolios/{id} */
export interface PortfolioDto extends PortfolioSummaryDto {
  limits: PortfolioLimitsDto
  /** Null for a real portfolio. */
  model: ModelAllocationDto | null
  /** Row version, sent back with PUT; a 409 means someone else changed the portfolio meanwhile. */
  version: string
}

/** POST /portfolios returns the PortfolioDto created. */
export interface PortfolioCreateDto {
  name: string
  kind: PortfolioKind
  currency: CurrencyCode
  benchmark: string
  limits: PortfolioLimitsDto
  model: ModelAllocationDto | null
}

/** PUT /portfolios/{id}: the kind and the currency do not change once created. */
export interface PortfolioUpdateDto {
  name: string
  benchmark: string
  limits: PortfolioLimitsDto
  model: ModelAllocationDto | null
  version: string
}

/** The nine transaction types of spec section 4. */
export type TransactionType =
  | 'buy'
  | 'sell'
  | 'subscription'
  | 'redemption'
  | 'dividend'
  | 'coupon'
  | 'fees'
  | 'deposit'
  | 'withdrawal'

/**
 * GET /portfolios/{id}/transactions, newest first. A buy, a sale or a subscription (a purchase at
 * issue) carries a quantity and a price; the other types an amount. A redemption is principal
 * repaid by a bond's issuer.
 */
export interface TransactionDto {
  id: string
  type: TransactionType
  /** Trade date; the prototype settles on the same day. */
  date: IsoDate
  securityId: string | null
  /** Display code, e.g. "ECMR 6.25% 29". */
  securityCode: string | null
  /** Shares, or bonds of their nominal value. */
  quantity: number | null
  /** Per share, or clean price per 100 of the principal outstanding for a bond. */
  price: number | null
  fees: number
  /**
   * Cash effect in the portfolio currency: negative for a purchase, fees or a withdrawal. A bond
   * purchase or sale includes the accrued interest.
   */
  amount: number
  /** Gain of a sale or a redemption over the average cost, fees included (spec section 14.2). */
  realizedGain: number | null
  note: string
  version: string
}

/** POST /portfolios/{id}/transactions, PUT .../transactions/{txId}. */
export interface TransactionInputDto {
  type: TransactionType
  date: IsoDate
  securityId: string | null
  quantity: number | null
  price: number | null
  fees: number | null
  /** Redemption, dividend, coupon, fees, deposit and withdrawal: the amount, positive. */
  amount: number | null
  note: string
  /** Required by PUT. */
  version?: string
}

/**
 * POST /portfolios/{id}/transactions/import, multipart with the CSV or Excel file of the template
 * as "file". All rows or none: a 400 lists the errors by row ("rows[3].quantity").
 */
export interface TransactionImportResultDto {
  imported: number
  from: IsoDate | null
  to: IsoDate | null
}

/** A line valued at the last price (spec section 14.2). */
export interface PositionDto {
  securityId: string
  code: string
  name: string
  type: SecurityType
  sector: string
  country: string
  issuer: string
  /** Currency of the price. */
  currency: CurrencyCode
  quantity: number
  /** Weighted average cost, fees included: per share, or per 100 of principal for a bond. */
  averageCost: number
  /** Last price; carried forward from the last session when the security did not trade today. */
  price: number
  previousClose: number
  /** The price is not from today's session ("stale price"). */
  isStale: boolean
  isDelayed: boolean
  /**
   * Value of one unit of price for the whole line, in the portfolio currency: the quantity times
   * the exchange rate, times the principal outstanding / 100 for a bond. The line is worth
   * price × priceFactor + accrued, which lets the screen follow live prices.
   */
  priceFactor: number
  /** Accrued interest of a bond line, in the portfolio currency; 0 for a share. */
  accrued: number
  value: number
  /** (price − averageCost) × priceFactor. */
  unrealizedGain: number
  unrealizedPct: number
  weightPct: number
  /** Modified duration of a bond at its last price, in years. */
  modifiedDuration: number | null
}

/** GET /portfolios/{id}/positions: largest line first. */
export interface PositionsDto {
  portfolioId: string
  currency: CurrencyCode
  asOf: IsoDateTime
  items: PositionDto[]
  cash: number
  /** Lines and cash. */
  totalValue: number
  /**
   * Value at the previous close plus today's deposits and withdrawals: the base of the day's
   * return, r = V / (V₋₁ + F) − 1.
   */
  previousValue: number
  /** Gains realized since inception. */
  realizedGain: number
}

/** Periods of spec section 4: day, month, year, since inception, plus 1 and 3 years. */
export type PerformancePeriod = 'day' | 'mtd' | 'ytd' | '1y' | '3y' | 'inception'

export interface PerformancePointDto {
  date: IsoDate
  /** Base 100 at the first date of the series. */
  portfolio: number
  benchmark: number | null
}

export interface PeriodReturnDto {
  period: PerformancePeriod
  /** Valuation the period starts from (YTD: the last one of the previous year), at inception at the earliest. */
  from: IsoDate
  /** Time-weighted return, in percent. */
  twrPct: number
  /** Only for periods longer than 365 days. */
  annualizedPct: number | null
  benchmarkPct: number | null
  /** (TWR − benchmark return) × 100, in points. */
  outperformancePts: number | null
}

/** GET /portfolios/{id}/performance?from=&to=&benchmark= (spec section 14.2). */
export interface PerformanceDto {
  portfolioId: string
  benchmark: {
    code: string
    name: string
    /** A price index is labelled as such: dividends are not reinvested in it. */
    kind: 'totalReturn' | 'price'
  }
  from: IsoDate
  to: IsoDate
  series: PerformancePointDto[]
  twrPct: number
  annualizedPct: number | null
  benchmarkPct: number | null
  outperformancePts: number | null
  /** Money-weighted return of the flows over the series (IRR), for client reports. */
  irrPct: number | null
  /** The standard periods, as of `to`. */
  periods: PeriodReturnDto[]
}

export type AllocationBy = 'asset' | 'sector' | 'country' | 'maturity'

export interface AllocationItemDto {
  /**
   * Asset class (equity, bond), sector, country code or maturity bucket of the bonds ("0-1",
   * "1-3", "3-5", "5-10", "10+"); "cash" for the cash, "equity" for shares in the maturity view.
   */
  key: string
  value: number
  weightPct: number
}

/** GET /portfolios/{id}/allocation?by=asset|sector|country|maturity: largest first, cash last. */
export interface AllocationDto {
  by: AllocationBy
  items: AllocationItemDto[]
}

export interface IssuerWeightDto {
  issuer: string
  weightPct: number
}

/**
 * GET /portfolios/{id}/risk: metrics of spec section 14.3 over a rolling year of daily returns.
 * Below `minObservations`, the market metrics are null: "insufficient data".
 */
export interface RiskDto {
  portfolioId: string
  from: IsoDate
  to: IsoDate
  observations: number
  minObservations: number
  /** Sessions over the last 365 days (A). */
  sessionsPerYear: number
  /** Share of line-days without a quote in the window, in percent; shown above 20%. */
  staleDaysPct: number
  benchmark: { code: string; name: string }
  volatilityPct: number | null
  benchmarkVolatilityPct: number | null
  maxDrawdownPct: number | null
  drawdownPeak: IsoDate | null
  drawdownTrough: IsoDate | null
  beta: number | null
  annualizedReturnPct: number | null
  sharpe: number | null
  /** Admin setting, the 52-week BTA rate by default; shown under the Sharpe ratio. */
  riskFreeRatePct: number
  trackingErrorPct: number | null
  informationRatio: number | null
  /** 1-day historical VaR 95%, in percent of the value and as an amount. */
  var95Pct: number | null
  var95Amount: number | null
  /** Bond sleeve modified duration, in years; null without bonds. */
  durationYears: number | null
  /** Issuers by weight, largest first; a country groups its bonds. */
  issuers: IssuerWeightDto[]
  /** Herfindahl index of the line weights, Σ w² (0 to 1). */
  hhi: number
  /** Securities held, cash aside. */
  lines: number
  limits: PortfolioLimitsDto
  /** Limits breached at the last valuation. */
  breaches: PortfolioLimit[]
}

export type IncomeKind = 'dividend' | 'coupon' | 'redemption'

export interface IncomeItemDto {
  date: IsoDate
  securityId: string
  securityCode: string
  kind: IncomeKind
  /** Dividend or coupon, in the portfolio currency. */
  income: number
  /** Principal repaid with a coupon or by a redemption, in the portfolio currency. */
  principal: number
}

/**
 * GET /portfolios/{id}/income: received is what the transactions recorded over the last 12
 * months; upcoming comes from the dividends announced and the bond schedules, for the lines held.
 */
export interface IncomeDto {
  portfolioId: string
  currency: CurrencyCode
  /** Newest first. */
  received: IncomeItemDto[]
  /** Next 12 months, soonest first. */
  upcoming: IncomeItemDto[]
  /** Dividends and coupons received since January 1st. */
  receivedYtd: number
  /** Dividends and coupons expected in the next 3 months, principal aside (screen 5 header). */
  upcoming3Months: number
}

export type ReportSection = 'positions' | 'performance' | 'risk' | 'income' | 'transactions'

/** POST /portfolios/{id}/reports: multipart, "options" as JSON and an optional "logo" image. */
export interface ReportRequestDto {
  title: string
  /** Null: since inception. */
  from: IsoDate | null
  to: IsoDate
  sections: ReportSection[]
  comments: string
  language: 'fr' | 'en'
}

export type ReportJobStatus = 'queued' | 'running' | 'done' | 'failed'

/** POST .../reports returns the job; GET /reports/{jobId} its progress, polled until done. */
export interface ReportJobDto {
  jobId: string
  portfolioId: string
  title: string
  status: ReportJobStatus
  /** 0 to 100. */
  progress: number
  createdAt: IsoDateTime
  /** API path of the PDF once done, fetched with the user's session. */
  downloadPath: string | null
  fileName: string | null
  error: string | null
}
