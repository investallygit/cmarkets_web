import type { PositionDto, PositionsDto } from '@/shared/api/contracts'

export interface LiveValuation {
  /** The lines with their value, gain and weight at the live prices. */
  items: PositionDto[]
  cash: number
  cashWeightPct: number
  totalValue: number
  /** Since the previous close, deposits and withdrawals of the day aside. */
  dayChange: number
  dayChangePct: number
}

/**
 * The server's valuation moved to the live prices (spec section 14.2): a line is worth
 * price × priceFactor + accrued interest, so only the price changes between two valuations.
 * `prices` follows `positions.items`; undefined keeps the server's price.
 */
export function valueAtPrices(
  positions: PositionsDto,
  prices: readonly (number | undefined)[],
): LiveValuation {
  const lines = positions.items.map((item, index) => {
    const price = prices[index] ?? item.price
    return {
      ...item,
      price,
      value: price * item.priceFactor + item.accrued,
      unrealizedGain: (price - item.averageCost) * item.priceFactor,
      unrealizedPct: item.averageCost > 0 ? (price / item.averageCost - 1) * 100 : 0,
    }
  })
  const totalValue = positions.cash + lines.reduce((sum, line) => sum + line.value, 0)
  const weight = (value: number) => (totalValue > 0 ? (value / totalValue) * 100 : 0)
  const dayChange = totalValue - positions.previousValue
  return {
    items: lines.map((line) => ({ ...line, weightPct: weight(line.value) })),
    cash: positions.cash,
    cashWeightPct: weight(positions.cash),
    totalValue,
    dayChange,
    dayChangePct: positions.previousValue > 0 ? (dayChange / positions.previousValue) * 100 : 0,
  }
}

/**
 * A period's time-weighted return with today's return swapped for the live one, in percent:
 * (1 + R) / (1 + r_today) × (1 + r_live) − 1, since the periods chain the daily returns.
 */
export function withLiveDay(periodPct: number, serverDayPct: number, liveDayPct: number): number {
  return ((1 + periodPct / 100) / (1 + serverDayPct / 100)) * (1 + liveDayPct / 100) * 100 - 100
}
