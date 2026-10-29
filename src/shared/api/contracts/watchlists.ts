import type { CurrencyCode } from './common'
import type { SecurityType } from './securities'

/** Columns a user can show in a watchlist (configurable per list, spec section 2). */
export type WatchlistColumn = 'last' | 'changePct' | 'volume' | 'sparkline'

export interface WatchlistItemDto {
  securityId: string
  code: string
  name: string
  type: SecurityType
  currency: CurrencyCode
  last: number
  changePct: number
  volume: number
  isDelayed: boolean
  /** Closing prices over the last 5 sessions, oldest first. */
  sparkline: number[]
}

/** GET /watchlists */
export interface WatchlistDto {
  id: string
  name: string
  /** Short code shown on the panel, e.g. "W1". */
  code: string
  columns: WatchlistColumn[]
  items: WatchlistItemDto[]
}
