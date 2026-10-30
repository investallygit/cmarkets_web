import type { OrderBookDto, OrderBookLevelDto, SecurityType } from '@/shared/api/contracts'
import { createRandom, hashString } from './random'

/** Best limits on each side (spec section 9, screen 2). */
const LEVELS = 5
/** The book changes every few seconds, like the polling that reads it. */
const BOOK_REFRESH_MS = 5_000

/** Price step between limits: 100 XAF above 10,000, 25 below; 0.05 for bonds per 100. */
function limitStep(type: SecurityType, last: number): number {
  if (type === 'bond') return 0.05
  return last >= 10_000 ? 100 : 25
}

/** GET /securities/{id}/orderbook: limits around the last price, the best ask at or above it. */
export function orderBook(
  security: { id: string; type: SecurityType; last: number },
  now = Date.now(),
): OrderBookDto {
  const random = createRandom(
    hashString(`book|${security.id}|${Math.floor(now / BOOK_REFRESH_MS)}`),
  )
  const step = limitStep(security.type, security.last)
  const round = (price: number) => Number(price.toFixed(security.type === 'bond' ? 2 : 0))
  const quantity = () =>
    security.type === 'bond' ? 100 + Math.round(random() * 900) : 5 + Math.round(random() * 55)
  const side = (best: number, direction: 1 | -1): OrderBookLevelDto[] => {
    const levels: OrderBookLevelDto[] = []
    let price = best
    for (let level = 0; level < LEVELS; level++) {
      levels.push({ price: round(price), quantity: quantity() })
      price += direction * step * (1 + Math.floor(random() * 3))
    }
    return levels
  }
  const bestAsk = Math.ceil(security.last / step - 1e-9) * step
  return {
    securityId: security.id,
    bids: side(bestAsk - step, -1),
    asks: side(bestAsk, 1),
    timestamp: new Date(now).toISOString(),
  }
}
