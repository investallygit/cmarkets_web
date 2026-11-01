import type { TransactionType } from '@/shared/api/contracts'
import type { MarketData, StoredPortfolio, StoredTransaction } from './model'
import { accruedOn, round2, unitValue } from './units'

/**
 * Transactions: their cash effect, the income the lines held receive, and the transactions a model
 * portfolio derives from its allocation.
 */

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
export function incomeEvents(
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

export function quantityBefore(
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
