/**
 * The exchanges that trade at a fixing, one price a session (spec section 9, screen 2, fifth
 * version; ROADMAP decision 38): BVMAC. Their securities have no order book, no intraday trades
 * and no candles: a session's open, high and low are its fixing.
 */
const FIXING_EXCHANGES: ReadonlySet<string> = new Set(['BVMAC'])

export function tradesAtFixing(security: { exchange: string }): boolean {
  return FIXING_EXCHANGES.has(security.exchange)
}
