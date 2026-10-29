import type { CurrencyCode, IsoDateTime } from './common'
import type { SecurityType } from './securities'

export type MarketSessionStatus = 'open' | 'closed'

/** GET /market/status */
export interface MarketStatusDto {
  status: MarketSessionStatus
  nextOpen: IsoDateTime | null
  /** Shown in the status bar, e.g. ["BVMAC", "BEAC"]. */
  sources: string[]
  asOf: IsoDateTime
}

export interface IndexQuoteDto {
  code: string
  name: string
  value: number
  previousClose: number
  change: number
  changePct: number
  timestamp: IsoDateTime
}

/** GET /market/summary */
export interface MarketSummaryDto {
  indices: IndexQuoteDto[]
  advancers: number
  decliners: number
  unchanged: number
  valueTraded: number
  currency: CurrencyCode
  asOf: IsoDateTime
}

export type MoversType = 'gainers' | 'losers' | 'volume'

/** GET /market/movers?type= */
export interface MoverDto {
  securityId: string
  code: string
  name: string
  type: SecurityType
  currency: CurrencyCode
  last: number
  changePct: number
  volume: number
  isDelayed: boolean
}

/** GET /market/ticker */
export interface TickerItemDto {
  kind: 'index' | 'security'
  /** Index code or security id; also the real-time symbol. */
  symbol: string
  label: string
  type: SecurityType | 'index'
  currency: CurrencyCode
  last: number
  changePct: number
}

export type HistoryInterval = '5m' | '30m' | '1d' | '1w'

/** GET /indices/{code}/history?from=&to=&interval= */
export interface HistoryPointDto {
  time: IsoDateTime
  value: number
}
