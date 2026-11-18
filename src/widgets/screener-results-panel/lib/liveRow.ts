import type { LiveQuote } from '@/entities/quote'
import type { ScreenerRowDto } from '@/shared/api/contracts'

/**
 * A result at its live price, as its live cells show it: the last and the change, and the market
 * cap, the P/E, the P/B and the yield moved with the price, each in proportion to it, so that they
 * agree with the change (B95) and a sorted column follows what it shows (B42).
 */
export function liveRow(row: ScreenerRowDto, quote: LiveQuote): ScreenerRowDto {
  if (quote.last === row.last || !(row.last > 0)) return { ...row, changePct: quote.changePct }
  const scale = quote.last / row.last
  return {
    ...row,
    last: quote.last,
    changePct: quote.changePct,
    marketCap: row.marketCap * scale,
    pe: row.pe === null ? null : row.pe * scale,
    priceToBook: row.priceToBook === null ? null : row.priceToBook * scale,
    dividendYield: row.dividendYield === null ? null : row.dividendYield / scale,
  }
}
