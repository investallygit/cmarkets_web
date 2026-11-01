import type { IncomeDto, IncomeItemDto } from '@/shared/api/contracts'
import { addDays, addMonths } from '@/shared/lib/isoDate'
import type { MarketData, StoredPortfolio } from './model'
import { effectiveTransactions, incomeEvents, quantityBefore } from './transactions'
import { round2 } from './units'
import type { Valuation } from './valuation'

/** Income received over the last year, and to come over the next one. */

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
