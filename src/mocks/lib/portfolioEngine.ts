import type {
  AllocationBy,
  AllocationDto,
  AllocationItemDto,
  IncomeDto,
  IncomeItemDto,
  IssuerWeightDto,
  ModelAllocationDto,
  PerformanceDto,
  PerformancePeriod,
  PeriodReturnDto,
  PortfolioKind,
  PortfolioLimit,
  PortfolioLimitsDto,
  PositionDto,
  PositionsDto,
  RiskDto,
  SecurityType,
  TransactionType,
} from '@/shared/api/contracts'
import { addDays, addMonths } from '@/shared/lib/isoDate'
import {
  accruedInterest,
  bondMeasures,
  settlementPeriod,
  yieldFromCleanPrice,
  type BondTerms,
} from './bondMath'
import {
  annualize,
  annualizedReturn,
  beta,
  buyLot,
  chainReturns,
  dailyReturns,
  herfindahl,
  historicalVar,
  maxDrawdown,
  moneyWeightedReturn,
  sellGain,
  trackingError,
  valueIndex,
  volatility,
  type Lot,
} from './portfolioMath'

/**
 * The portfolio service of the fake back end: it replays a portfolio's transactions over the
 * price history and values it each session (spec section 14.2), then derives the positions,
 * performance, allocation, risk (14.3) and income the screen shows.
 */

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

/** Below this many daily returns, the market risk metrics read "insufficient data". */
export const MIN_OBSERVATIONS = 60

const round2 = (value: number) => Math.round(value * 100) / 100

/** Principal outstanding after the payments made by `day`, per 100 of original face value. */
export function outstandingPct(bond: PortfolioBond, day: string): number {
  return bond.schedule.findLast((flow) => flow.date <= day)?.outstanding ?? 100
}

/** Value of one point of price per bond: nominal × outstanding / 100 / 100; 1 for a share. */
function unitValue(market: MarketData, securityId: string, day: string): number {
  const bond = market.bond(securityId)
  return bond ? (bond.nominal * outstandingPct(bond, day)) / 10_000 : 1
}

/** Accrued interest per 100 of principal outstanding; 0 for a share, before issue or after maturity. */
function accruedOn(market: MarketData, securityId: string, day: string): number {
  const bond = market.bond(securityId)
  if (!bond) return 0
  try {
    return accruedInterest(bond, settlementPeriod(bond, day))
  } catch {
    return 0
  }
}

function modifiedDuration(bond: PortfolioBond, day: string, cleanPrice: number): number | null {
  try {
    const period = settlementPeriod(bond, day)
    return bondMeasures(bond, period, yieldFromCleanPrice(bond, period, cleanPrice))
      .modifiedDuration
  } catch {
    return null
  }
}

export interface TransactionFields {
  type: TransactionType
  date: string
  securityId: string | null
  quantity: number | null
  price: number | null
  fees: number
  /** Positive, for the types without a quantity. */
  amount: number | null
}

/**
 * Cash effect of a transaction in the portfolio currency. A bond trade settles its accrued
 * interest with the clean price: q × principal × (clean + AI) / 100.
 */
export function transactionAmount(
  fields: TransactionFields,
  currency: string,
  market: MarketData,
): number {
  const amount = fields.amount ?? 0
  switch (fields.type) {
    case 'deposit':
    case 'dividend':
    case 'coupon':
    case 'redemption':
      return round2(amount)
    case 'withdrawal':
    case 'fees':
      return round2(-amount)
    case 'buy':
    case 'subscription':
    case 'sell': {
      const id = fields.securityId ?? ''
      const security = market.security(id)
      const fx = security ? market.fx(security.currency, currency) : 1
      const gross =
        (fields.quantity ?? 0) *
        unitValue(market, id, fields.date) *
        ((fields.price ?? 0) + accruedOn(market, id, fields.date))
      return round2(
        fields.type === 'sell' ? (gross - fields.fees) * fx : -(gross + fields.fees) * fx,
      )
    }
  }
}

interface IncomeEvent {
  securityId: string
  date: string
  /** Holdings at the end of the day before count: the ex-date for a dividend. */
  recordDate: string
  kind: 'dividend' | 'coupon' | 'redemption'
  /** Per share, or per bond. */
  perUnit: number
}

/** Dividends paid, coupons and redemptions of a security in (after, until]. */
function incomeEvents(
  market: MarketData,
  securityId: string,
  after: string,
  until: string,
): IncomeEvent[] {
  const bond = market.bond(securityId)
  if (bond) {
    return bond.schedule
      .filter((flow) => flow.date > after && flow.date <= until)
      .flatMap((flow) => {
        const events: IncomeEvent[] = [
          {
            securityId,
            date: flow.date,
            recordDate: flow.date,
            kind: 'coupon',
            perUnit: (bond.nominal * flow.coupon) / 100,
          },
        ]
        if (flow.amortization > 0) {
          events.push({
            securityId,
            date: flow.date,
            recordDate: flow.date,
            kind: 'redemption',
            perUnit: (bond.nominal * flow.amortization) / 100,
          })
        }
        return events
      })
  }
  return market
    .dividends(securityId)
    .filter((dividend) => dividend.paymentDate > after && dividend.paymentDate <= until)
    .map((dividend) => ({
      securityId,
      date: dividend.paymentDate,
      recordDate: dividend.exDate,
      kind: 'dividend' as const,
      perUnit: dividend.amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function quantityBefore(
  transactions: readonly StoredTransaction[],
  securityId: string,
  day: string,
): number {
  return transactions.reduce((quantity, transaction) => {
    if (transaction.securityId !== securityId || transaction.date >= day) return quantity
    if (transaction.type === 'buy' || transaction.type === 'subscription') {
      return quantity + (transaction.quantity ?? 0)
    }
    return transaction.type === 'sell' ? quantity - (transaction.quantity ?? 0) : quantity
  }, 0)
}

/**
 * Dividends, coupons and redemptions of the lines held, as transactions, for the sample
 * portfolios and the model portfolios: what the holder of the lines received in (after, until].
 */
export function incomeTransactions(
  market: MarketData,
  holdings: readonly StoredTransaction[],
  currency: string,
  after: string,
  until: string,
): Omit<StoredTransaction, 'id' | 'version'>[] {
  const ids = [...new Set(holdings.flatMap((transaction) => transaction.securityId ?? []))]
  return ids.flatMap((securityId) => {
    const security = market.security(securityId)
    if (!security) return []
    const fx = market.fx(security.currency, currency)
    return incomeEvents(market, securityId, after, until).flatMap((event) => {
      const quantity = quantityBefore(holdings, securityId, event.recordDate)
      if (quantity <= 0) return []
      return [
        {
          type: event.kind,
          date: event.date,
          securityId,
          quantity: null,
          price: null,
          fees: 0,
          amount: round2(quantity * event.perUnit * fx),
          note: '',
        },
      ]
    })
  })
}

/**
 * A model portfolio buys its lines at the closing prices of its start date, whole units only,
 * and keeps the rest in cash; then it receives the income of what it holds.
 */
function modelTransactions(portfolio: StoredPortfolio, market: MarketData): StoredTransaction[] {
  const model = portfolio.model
  if (!model) return []
  const start = market.sessions(model.startDate, market.today).at(0)
  if (!start) return []
  const synthetic = (
    index: number,
    fields: Omit<StoredTransaction, 'id' | 'version'>,
  ): StoredTransaction => ({ ...fields, id: `model-${index}`, version: 1 })
  const transactions: StoredTransaction[] = [
    synthetic(0, {
      type: 'deposit',
      date: start,
      securityId: null,
      quantity: null,
      price: null,
      fees: 0,
      amount: model.notional,
      note: '',
    }),
  ]
  model.lines.forEach((line, index) => {
    const security = market.security(line.securityId)
    // Today's session has no close yet: a model started today buys at the previous one.
    const close =
      start < market.today
        ? market.closes(line.securityId, start, start).get(start)
        : market.quote(line.securityId)?.previousClose
    if (!security || close === undefined) return
    const fx = market.fx(security.currency, portfolio.currency)
    const perUnit =
      unitValue(market, line.securityId, start) *
      (close + accruedOn(market, line.securityId, start)) *
      fx
    const quantity = Math.floor(((line.weightPct / 100) * model.notional) / perUnit)
    if (quantity <= 0) return
    const fields: TransactionFields = {
      type: 'buy',
      date: start,
      securityId: line.securityId,
      quantity,
      price: close,
      fees: 0,
      amount: null,
    }
    transactions.push(
      synthetic(index + 1, {
        ...fields,
        amount: transactionAmount(fields, portfolio.currency, market),
        note: '',
      }),
    )
  })
  incomeTransactions(market, transactions, portfolio.currency, start, market.today).forEach(
    (fields, index) => transactions.push(synthetic(1000 + index, fields)),
  )
  return transactions
}

/** The transactions the valuation replays: recorded ones, or those of the model's allocation. */
export function effectiveTransactions(
  portfolio: StoredPortfolio,
  market: MarketData,
): StoredTransaction[] {
  const transactions =
    portfolio.kind === 'model' ? modelTransactions(portfolio, market) : portfolio.transactions
  // Stable: transactions of the same day keep the order they were recorded in.
  return [...transactions].sort((a, b) => a.date.localeCompare(b.date))
}

export interface Valuation {
  /** Session days from inception, the last one today once its session has opened. */
  days: string[]
  values: number[]
  /** Deposits and withdrawals at the start of each day. */
  flows: number[]
  holdings: Map<string, Lot>
  cash: number
  realized: number
  realizedById: Map<string, number>
  /** A sale of more than held: the transaction and what was held. */
  oversold: { transactionId: string; held: number } | null
}

/** Replays the transactions and values the portfolio at each session's closing prices. */
export function valuePortfolio(
  transactions: readonly StoredTransaction[],
  currency: string,
  market: MarketData,
): Valuation {
  const result: Valuation = {
    days: [],
    values: [],
    flows: [],
    holdings: new Map(),
    cash: 0,
    realized: 0,
    realizedById: new Map(),
    oversold: null,
  }
  const first = transactions.at(0)
  if (!first) return result

  const { today } = market
  const ids = [...new Set(transactions.flatMap((transaction) => transaction.securityId ?? []))]
  const closes = new Map(ids.map((id) => [id, market.closes(id, first.date, today)]))
  const lastClose = new Map<string, number>()
  const fxOf = (id: string) => market.fx(market.security(id)?.currency ?? currency, currency)

  const apply = (transaction: StoredTransaction): number => {
    const { securityId, quantity, price, fees, amount, type, date, id } = transaction
    result.cash += amount
    if (!securityId) return type === 'deposit' || type === 'withdrawal' ? amount : 0
    const lot = result.holdings.get(securityId) ?? { quantity: 0, averageCost: 0 }
    const unit = unitValue(market, securityId, date)
    switch (type) {
      case 'buy':
      case 'subscription':
        result.holdings.set(securityId, buyLot(lot, quantity ?? 0, price ?? 0, fees, unit))
        break
      case 'sell': {
        const sold = quantity ?? 0
        if (sold > lot.quantity + 1e-9 && !result.oversold) {
          result.oversold = { transactionId: id, held: lot.quantity }
        }
        // Prices and fees are in the security's currency, the gain in the portfolio's.
        const gain = sellGain(lot, sold, price ?? 0, fees, unit) * fxOf(securityId)
        result.realized += gain
        result.realizedById.set(id, round2(gain))
        const left = lot.quantity - sold
        if (left > 1e-9) result.holdings.set(securityId, { ...lot, quantity: left })
        else result.holdings.delete(securityId)
        break
      }
      case 'redemption':
        // Each 100 of principal repaid cost the average price.
        if (lot.quantity > 0) {
          const gain = amount * (1 - lot.averageCost / 100)
          result.realized += gain
          result.realizedById.set(id, round2(gain))
        }
        break
      default:
        break
    }
    return 0
  }

  const valueAt = (day: string) => {
    let value = result.cash
    for (const [id, lot] of result.holdings) {
      const close = closes.get(id)?.get(day) ?? lastClose.get(id)
      if (close === undefined) continue
      lastClose.set(id, close)
      value +=
        lot.quantity * unitValue(market, id, day) * (close + accruedOn(market, id, day)) * fxOf(id)
    }
    return value
  }

  let next = 0
  for (const day of market.sessions(first.date, today)) {
    let flow = 0
    while (next < transactions.length && transactions[next].date <= day) {
      flow += apply(transactions[next])
      next += 1
    }
    result.days.push(day)
    result.flows.push(flow)
    result.values.push(valueAt(day))
  }
  // Recorded on a day without a session after the last one (a weekend): in the holdings only.
  while (next < transactions.length) apply(transactions[next++])
  return result
}

export function portfolioValuation(portfolio: StoredPortfolio, market: MarketData): Valuation {
  return valuePortfolio(effectiveTransactions(portfolio, market), portfolio.currency, market)
}

/** GET /portfolios/{id}/positions */
export function positionsOf(
  portfolio: StoredPortfolio,
  valuation: Valuation,
  market: MarketData,
  asOf: string,
): PositionsDto {
  const { today } = market
  const lines = [...valuation.holdings].flatMap(([id, lot]) => {
    const security = market.security(id)
    const quote = market.quote(id)
    const unit = unitValue(market, id, today)
    if (!security || !quote || unit === 0 || lot.quantity <= 0) return []
    const bond = market.bond(id)
    const priceFactor = lot.quantity * unit * market.fx(security.currency, portfolio.currency)
    const accrued = round2(priceFactor * accruedOn(market, id, today))
    return [
      {
        security,
        lot,
        quote,
        priceFactor,
        accrued,
        value: quote.last * priceFactor + accrued,
        duration: bond ? modifiedDuration(bond, today, quote.last) : null,
      },
    ]
  })
  const totalValue = valuation.cash + lines.reduce((sum, line) => sum + line.value, 0)
  const items = lines
    .sort((a, b) =>
      a.security.type === b.security.type
        ? b.value - a.value
        : a.security.type === 'equity'
          ? -1
          : 1,
    )
    .map(({ security, lot, quote, priceFactor, accrued, value, duration }): PositionDto => ({
      securityId: security.id,
      code: security.code,
      name: security.name,
      type: security.type,
      sector: security.sector,
      country: security.country,
      issuer: security.issuer,
      currency: security.currency,
      quantity: lot.quantity,
      averageCost: round2(lot.averageCost),
      price: quote.last,
      previousClose: quote.previousClose,
      isStale: !quote.tradedToday,
      isDelayed: quote.isDelayed,
      priceFactor,
      accrued,
      value: round2(value),
      unrealizedGain: round2((quote.last - lot.averageCost) * priceFactor),
      unrealizedPct: lot.averageCost > 0 ? (quote.last / lot.averageCost - 1) * 100 : 0,
      weightPct: totalValue > 0 ? (value / totalValue) * 100 : 0,
      modifiedDuration: duration,
    }))
  const count = valuation.values.length
  const previousValue =
    count >= 2 ? valuation.values[count - 2] + valuation.flows[count - 1] : totalValue
  return {
    portfolioId: portfolio.id,
    currency: portfolio.currency,
    asOf,
    items,
    cash: round2(valuation.cash),
    totalValue: round2(totalValue),
    previousValue: round2(previousValue),
    realizedGain: round2(valuation.realized),
  }
}

/** Position of the last valuation on or before `day`; the first one when `day` comes before it. */
function anchorIndex(days: readonly string[], day: string): number {
  return Math.max(
    0,
    days.findLastIndex((candidate) => candidate <= day),
  )
}

function periodStart(period: PerformancePeriod, to: string, days: readonly string[]): string {
  switch (period) {
    case 'day':
      return days[Math.max(0, days.length - 2)] ?? to
    case 'mtd':
      return addDays(`${to.slice(0, 7)}-01`, -1)
    case 'ytd':
      return `${Number(to.slice(0, 4)) - 1}-12-31`
    case '1y':
      return addMonths(to, -12)
    case '3y':
      return addMonths(to, -36)
    case 'inception':
      return days[0] ?? to
  }
}

const PERIODS: readonly PerformancePeriod[] = ['day', 'mtd', 'ytd', '1y', '3y', 'inception']

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)

interface Window {
  start: number
  end: number
}

function windowReturns(valuation: Valuation, { start, end }: Window): number[] {
  return dailyReturns(valuation.values.slice(start, end + 1), valuation.flows.slice(start, end + 1))
}

function benchmarkReturn(
  closes: Map<string, number>,
  days: readonly string[],
  { start, end }: Window,
): number | null {
  const first = closes.get(days[start])
  const last = closes.get(days[end])
  return first && last ? last / first - 1 : null
}

/** GET /portfolios/{id}/performance?from=&to=&benchmark= (spec section 14.2). */
export function performanceOf(
  portfolio: StoredPortfolio,
  valuation: Valuation,
  market: MarketData,
  query: { from: string | null; to: string | null; benchmark: string | null },
): PerformanceDto {
  const { days } = valuation
  const code = query.benchmark ?? portfolio.benchmark
  const index = market.index(code)
  const to = query.to ?? market.today
  const benchmark = { code, name: index?.name ?? code, kind: 'price' as const }
  if (days.length === 0) {
    return {
      portfolioId: portfolio.id,
      benchmark,
      from: query.from ?? to,
      to,
      series: [],
      twrPct: 0,
      annualizedPct: null,
      benchmarkPct: null,
      outperformancePts: null,
      irrPct: null,
      periods: [],
    }
  }
  const end = anchorIndex(days, to)
  const toDay = days[end]
  const closes = market.indexCloses(code, days[0], toDay)
  const window = (from: string): Window => ({ start: Math.min(anchorIndex(days, from), end), end })

  const returnsOver = (range: Window) => {
    const twr = chainReturns(windowReturns(valuation, range))
    const bench = benchmarkReturn(closes, days, range)
    const length = daysBetween(days[range.start], toDay)
    return {
      twr,
      annualized: annualize(twr, length),
      bench,
      outperformance: bench === null ? null : (twr - bench) * 100,
    }
  }
  const pct = (value: number | null) => (value === null ? null : value * 100)

  const range = window(query.from ?? days[0])
  const returns = windowReturns(valuation, range)
  const portfolioIndex = valueIndex(returns, 100)
  const benchStart = closes.get(days[range.start])
  const series = portfolioIndex.map((value, offset) => {
    const day = days[range.start + offset]
    const close = closes.get(day)
    return {
      date: day,
      portfolio: round2(value),
      benchmark: benchStart && close ? round2((close / benchStart) * 100) : null,
    }
  })
  const whole = returnsOver(range)
  const flows = days
    .slice(range.start + 1, range.end + 1)
    .map((day, offset) => ({
      days: daysBetween(days[range.start], day),
      amount: valuation.flows[range.start + 1 + offset],
    }))
    .filter((flow) => flow.amount !== 0)
  const irr =
    range.end > range.start
      ? moneyWeightedReturn(
          valuation.values[range.start],
          flows,
          valuation.values[range.end],
          daysBetween(days[range.start], toDay),
        )
      : null

  const periods = PERIODS.flatMap((period): PeriodReturnDto[] => {
    const start = periodStart(period, toDay, days.slice(0, end + 1))
    // 1 and 3 years only once the track record is that long.
    if ((period === '1y' || period === '3y') && start < days[0]) return []
    const periodRange = window(start)
    const result = returnsOver(periodRange)
    return [
      {
        period,
        from: days[periodRange.start],
        twrPct: result.twr * 100,
        annualizedPct: pct(result.annualized),
        benchmarkPct: pct(result.bench),
        outperformancePts: result.outperformance,
      },
    ]
  })

  return {
    portfolioId: portfolio.id,
    benchmark,
    from: days[range.start],
    to: toDay,
    series,
    twrPct: whole.twr * 100,
    annualizedPct: pct(whole.annualized),
    benchmarkPct: pct(whole.bench),
    outperformancePts: whole.outperformance,
    irrPct: pct(irr),
    periods,
  }
}

const MATURITY_BUCKETS: readonly [key: string, years: number][] = [
  ['0-1', 1],
  ['1-3', 3],
  ['3-5', 5],
  ['5-10', 10],
  ['10+', Infinity],
]

function allocationKey(position: PositionDto, by: AllocationBy, market: MarketData): string {
  switch (by) {
    case 'asset':
      return position.type
    case 'sector':
      return position.sector
    case 'country':
      return position.country
    case 'maturity': {
      const bond = market.bond(position.securityId)
      if (!bond) return 'equity'
      const years = daysBetween(market.today, bond.maturityDate) / 365
      return MATURITY_BUCKETS.find(([, limit]) => years < limit)?.[0] ?? '10+'
    }
  }
}

/** GET /portfolios/{id}/allocation?by= : largest first, cash last. */
export function allocationOf(
  positions: PositionsDto,
  by: AllocationBy,
  market: MarketData,
): AllocationDto {
  const groups = new Map<string, number>()
  for (const position of positions.items) {
    const key = allocationKey(position, by, market)
    groups.set(key, (groups.get(key) ?? 0) + position.value)
  }
  const weight = (value: number) =>
    positions.totalValue > 0 ? (value / positions.totalValue) * 100 : 0
  const items: AllocationItemDto[] = [...groups]
    .map(([key, value]) => ({ key, value: round2(value), weightPct: weight(value) }))
    .sort((a, b) => b.value - a.value)
  if (positions.cash !== 0) {
    items.push({ key: 'cash', value: positions.cash, weightPct: weight(positions.cash) })
  }
  return { by, items }
}

function issuerWeights(positions: PositionsDto): IssuerWeightDto[] {
  const weights = new Map<string, number>()
  for (const position of positions.items) {
    weights.set(position.issuer, (weights.get(position.issuer) ?? 0) + position.weightPct)
  }
  return [...weights]
    .map(([issuer, weightPct]) => ({ issuer, weightPct }))
    .sort((a, b) => b.weightPct - a.weightPct)
}

/** Limits breached by the metrics: drawdowns are negative, their limit a positive depth. */
function breachesOf(risk: Omit<RiskDto, 'breaches'>): PortfolioLimit[] {
  const { limits } = risk
  const above = (value: number | null | undefined, limit: number | null) =>
    value !== null && value !== undefined && limit !== null && value > limit
  const breaches: PortfolioLimit[] = []
  if (above(risk.issuers.at(0)?.weightPct, limits.issuerWeightPct)) breaches.push('issuerWeightPct')
  if (above(risk.volatilityPct, limits.volatilityPct)) breaches.push('volatilityPct')
  if (above(risk.maxDrawdownPct === null ? null : -risk.maxDrawdownPct, limits.drawdownPct)) {
    breaches.push('drawdownPct')
  }
  if (above(risk.beta, limits.beta)) breaches.push('beta')
  if (above(risk.durationYears, limits.durationYears)) breaches.push('durationYears')
  return breaches
}

/** GET /portfolios/{id}/risk: a rolling year of daily returns (spec section 14.3). */
export function riskOf(
  portfolio: StoredPortfolio,
  valuation: Valuation,
  positions: PositionsDto,
  market: MarketData,
): RiskDto {
  const { days } = valuation
  const { today } = market
  const yearAgo = addDays(today, -365)
  const end = days.length - 1
  // The return of the first day in the window is measured from the day before it.
  const firstInWindow = days.findIndex((day) => day > yearAgo)
  const start = firstInWindow === -1 ? end : Math.max(0, firstInWindow - 1)
  const range = { start: Math.max(0, start), end: Math.max(0, end) }
  const returns = end > 0 ? windowReturns(valuation, range) : []
  const sessionsPerYear = market.sessions(addDays(today, -364), today).length
  const code = portfolio.benchmark
  const closes =
    days.length > 0 ? market.indexCloses(code, days[range.start], today) : new Map<string, number>()
  const benchmarkReturns = days.slice(range.start + 1, range.end + 1).map((day, offset) => {
    const before = closes.get(days[range.start + offset])
    const after = closes.get(day)
    return before && after ? after / before - 1 : 0
  })
  const enough = returns.length >= MIN_OBSERVATIONS
  const sigma = enough ? volatility(returns, sessionsPerYear) : null
  const annual = enough ? annualizedReturn(returns, sessionsPerYear) : null
  const benchAnnual = enough ? annualizedReturn(benchmarkReturns, sessionsPerYear) : null
  const te = enough ? trackingError(returns, benchmarkReturns, sessionsPerYear) : null
  const drawdown = enough ? maxDrawdown(valueIndex(returns)) : null
  const dayAt = (offset: number) => (offset < 0 ? null : (days[range.start + offset] ?? null))
  const rf = market.riskFreeRatePct / 100
  const varFraction = enough ? historicalVar(returns) : null

  const bonds = positions.items.filter((position) => position.modifiedDuration !== null)
  const bondValue = bonds.reduce((sum, position) => sum + position.value, 0)
  const lineDays = positions.items.length * returns.length
  const quiet = positions.items.reduce(
    (sum, position) =>
      sum + market.quietDays(position.securityId, days[range.start + 1] ?? today, today),
    0,
  )

  const risk: Omit<RiskDto, 'breaches'> = {
    portfolioId: portfolio.id,
    from: days[range.start] ?? today,
    to: days[range.end] ?? today,
    observations: returns.length,
    minObservations: MIN_OBSERVATIONS,
    sessionsPerYear,
    staleDaysPct: lineDays > 0 ? (quiet / lineDays) * 100 : 0,
    benchmark: { code, name: market.index(code)?.name ?? code },
    volatilityPct: sigma === null ? null : sigma * 100,
    benchmarkVolatilityPct: enough ? volatility(benchmarkReturns, sessionsPerYear) * 100 : null,
    maxDrawdownPct: drawdown ? drawdown.value * 100 : null,
    drawdownPeak: drawdown ? dayAt(drawdown.peak) : null,
    drawdownTrough: drawdown ? dayAt(drawdown.trough) : null,
    beta: enough ? beta(returns, benchmarkReturns) : null,
    annualizedReturnPct: annual === null ? null : annual * 100,
    sharpe: annual === null || !sigma ? null : (annual - rf) / sigma,
    riskFreeRatePct: market.riskFreeRatePct,
    trackingErrorPct: te === null ? null : te * 100,
    informationRatio:
      annual === null || benchAnnual === null || !te ? null : (annual - benchAnnual) / te,
    var95Pct: varFraction === null ? null : varFraction * 100,
    var95Amount: varFraction === null ? null : round2(varFraction * positions.totalValue),
    durationYears:
      bondValue > 0
        ? bonds.reduce(
            (sum, position) => sum + position.value * (position.modifiedDuration ?? 0),
            0,
          ) / bondValue
        : null,
    issuers: issuerWeights(positions),
    hhi: herfindahl(positions.items.map((position) => position.weightPct / 100)),
    lines: positions.items.length,
    limits: portfolio.limits,
  }
  return { ...risk, breaches: breachesOf(risk) }
}

/** GET /portfolios/{id}/income */
export function incomeOf(
  portfolio: StoredPortfolio,
  valuation: Valuation,
  market: MarketData,
): IncomeDto {
  const { today } = market
  const transactions = effectiveTransactions(portfolio, market)
  const codeOf = (id: string) => market.security(id)?.code ?? id
  const yearAgo = addDays(today, -365)
  const received = transactions
    .filter(
      (transaction) =>
        transaction.securityId !== null &&
        (transaction.type === 'dividend' ||
          transaction.type === 'coupon' ||
          transaction.type === 'redemption') &&
        transaction.date > yearAgo &&
        transaction.date <= today,
    )
    .map((transaction): IncomeItemDto => {
      const kind = transaction.type as IncomeItemDto['kind']
      return {
        date: transaction.date,
        securityId: transaction.securityId ?? '',
        securityCode: codeOf(transaction.securityId ?? ''),
        kind,
        income: kind === 'redemption' ? 0 : transaction.amount,
        principal: kind === 'redemption' ? transaction.amount : 0,
      }
    })
    .reverse()

  // What the lines held today will receive; a dividend whose ex-date has passed goes to the
  // holders of that day.
  const upcomingByKey = new Map<string, IncomeItemDto>()
  for (const [securityId, lot] of valuation.holdings) {
    const security = market.security(securityId)
    if (!security || lot.quantity <= 0) continue
    const fx = market.fx(security.currency, portfolio.currency)
    for (const event of incomeEvents(market, securityId, today, addMonths(today, 12))) {
      const quantity =
        event.recordDate <= today
          ? quantityBefore(transactions, securityId, event.recordDate)
          : lot.quantity
      if (quantity <= 0) continue
      const amount = round2(quantity * event.perUnit * fx)
      const key = `${event.date}|${securityId}`
      const item = upcomingByKey.get(key) ?? {
        date: event.date,
        securityId,
        securityCode: security.code,
        kind: event.kind === 'dividend' ? 'dividend' : 'coupon',
        income: 0,
        principal: 0,
      }
      if (event.kind === 'redemption') item.principal += amount
      else item.income += amount
      upcomingByKey.set(key, item)
    }
  }
  const upcoming = [...upcomingByKey.values()].sort((a, b) => a.date.localeCompare(b.date))
  const threeMonths = addMonths(today, 3)
  return {
    portfolioId: portfolio.id,
    currency: portfolio.currency,
    received,
    upcoming,
    receivedYtd: round2(
      received
        .filter((item) => item.date >= `${today.slice(0, 4)}-01-01`)
        .reduce((sum, item) => sum + item.income, 0),
    ),
    upcoming3Months: round2(
      upcoming
        .filter((item) => item.date <= threeMonths)
        .reduce((sum, item) => sum + item.income, 0),
    ),
  }
}
