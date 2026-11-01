import type { PositionDto, PositionsDto } from '@/shared/api/contracts'
import { buyLot, dailyReturns, sellGain, type Lot } from '../portfolioMath'
import type { MarketData, StoredPortfolio, StoredTransaction } from './model'
import { effectiveTransactions } from './transactions'
import { accruedOn, modifiedDuration, round2, unitValue } from './units'

/**
 * The valuation: the transactions replayed over the price history and valued at each session's
 * close (spec section 14.2), the positions it holds, and its daily returns over a window.
 */

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

export interface Window {
  start: number
  end: number
}

export function windowReturns(valuation: Valuation, { start, end }: Window): number[] {
  return dailyReturns(valuation.values.slice(start, end + 1), valuation.flows.slice(start, end + 1))
}
