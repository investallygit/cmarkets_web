import type { CurrencyCode, DataSource, IsoDateTime } from './common'

export type SecurityType = 'equity' | 'bond'

export interface SecuritySearchItemDto {
  /** CMarket security code, e.g. "SEMC" or "AAPL.US". */
  id: string
  /** Display code, e.g. "ECMR 6.25% 29". */
  code: string
  name: string
  type: SecurityType
  exchange: string
  country: string
  currency: CurrencyCode
}

/** GET /search?q= (command bar autocomplete). Function codes are resolved by the front end. */
export interface SearchResultsDto {
  securities: SecuritySearchItemDto[]
}

/** GET /securities/{id}/quote, example response in spec section 10. */
export interface QuoteDto {
  securityId: string
  name: string
  currency: CurrencyCode
  last: number
  previousClose: number
  change: number
  changePct: number
  volume: number
  marketCap: number
  source: DataSource
  isDelayed: boolean
  timestamp: IsoDateTime
}
