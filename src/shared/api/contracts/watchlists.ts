import type { CurrencyCode } from './common'
import type { SecurityType } from './securities'

/** Columns a user can show next to the security code (configurable per list, spec section 2). */
export type WatchlistColumn = 'name' | 'last' | 'change' | 'changePct' | 'volume' | 'sparkline'

export interface WatchlistItemDto {
  securityId: string
  code: string
  name: string
  type: SecurityType
  currency: CurrencyCode
  last: number
  /** Change since the previous close. */
  change: number
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
  /** Short code shown on the panel, given by the server: "W1", "W2"... */
  code: string
  columns: WatchlistColumn[]
  items: WatchlistItemDto[]
}

/**
 * POST /watchlists returns the new WatchlistDto, PUT /watchlists/{id} the updated one.
 * POST /watchlists/{id}/items/{securityId} returns the WatchlistItemDto added.
 */
export interface WatchlistInputDto {
  name: string
  columns: WatchlistColumn[]
  /** POST only: the securities the new list starts with. */
  securityIds?: string[]
}
