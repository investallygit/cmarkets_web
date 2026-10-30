import type { CalendarEventType } from './calendar'
import type { CurrencyCode, DataSource, IsoDate, IsoDateTime } from './common'
import type { HistoryPointDto } from './market'

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

/** GET /securities?type=&sector=&country=&market=: the securities of a market. */
export interface SecurityListItemDto extends SecuritySearchItemDto {
  sector: string
}

/** GET /search?q= (command bar autocomplete). Function codes are resolved by the front end. */
export interface SearchResultsDto {
  securities: SecuritySearchItemDto[]
}

/** GET /securities/{id}: reference data of the security profile (spec section 9, screen 2). */
export interface SecurityProfileDto extends SecuritySearchItemDto {
  isin: string
  issuer: string
  sector: string
  /** Equities only. */
  sharesOutstanding: number | null
  freeFloatPct: number | null
  high52w: number
  low52w: number
  /** Beta over one year against `betaIndex` (spec section 14.3); null below 60 observations. */
  beta1y: number | null
  betaIndex: string
  pe: number | null
  /** Dividend yield for an equity, yield to maturity for a bond, in percent. */
  yieldPct: number | null
  lastDividend: { amount: number; paymentDate: IsoDate } | null
  nextEvent: { type: CalendarEventType; title: string; date: IsoDate } | null
}

/** One bar of GET /securities/{id}/history?from=&to=&interval= (OHLCV, spec section 10). */
export interface PriceBarDto {
  /** Start of the bar: the session date for daily bars. */
  time: IsoDateTime
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * GET /securities/{id}/quote, example response in spec section 10, with the session's open,
 * high and low that the security header shows.
 */
export interface QuoteDto {
  securityId: string
  name: string
  currency: CurrencyCode
  last: number
  previousClose: number
  change: number
  changePct: number
  open: number
  high: number
  low: number
  volume: number
  marketCap: number
  source: DataSource
  isDelayed: boolean
  timestamp: IsoDateTime
}

export interface OrderBookLevelDto {
  price: number
  quantity: number
}

/** GET /securities/{id}/orderbook: best limits, best price first (spec section 9, screen 2). */
export interface OrderBookDto {
  securityId: string
  bids: OrderBookLevelDto[]
  asks: OrderBookLevelDto[]
  timestamp: IsoDateTime
}

/** GET /securities/{id}/trades: latest trades of the session, newest first. */
export interface TradeDto {
  time: IsoDateTime
  price: number
  quantity: number
}

/** GET /securities/{id}/dividends: newest first. */
export interface DividendDto {
  fiscalYear: number
  kind: 'final' | 'interim' | 'special'
  /** Net amount per share. */
  amount: number
  currency: CurrencyCode
  exDate: IsoDate
  paymentDate: IsoDate
  /** Net amount over the price before the ex-date, in percent. */
  yieldPct: number
}

export interface ShareholderDto {
  name: string
  shares: number
  pct: number
}

/** GET /securities/{id}/shareholders */
export interface ShareholdersDto {
  asOf: IsoDate
  items: ShareholderDto[]
}

export type IndicatorType = 'SMA' | 'BBANDS' | 'RSI' | 'MACD'

/**
 * GET /indicators/{securityId}?type=&period=&from=&to=&interval=, computed by the server.
 * One line per output: SMA and RSI "value"; BBANDS "upper", "middle", "lower";
 * MACD "macd", "signal", "histogram".
 */
export interface IndicatorDto {
  type: IndicatorType
  period: number
  lines: Record<string, HistoryPointDto[]>
}

export interface ChartPointDto {
  time: IsoDateTime
  price: number
}

/** A line drawn by the user on a price chart (spec section 3). */
export type ChartDrawingDto =
  | { id: string; kind: 'trendline'; from: ChartPointDto; to: ChartPointDto }
  | { id: string; kind: 'horizontal'; price: number }

/** GET / PUT /charts/{securityId}/drawings: saved per user. */
export interface ChartDrawingsDto {
  securityId: string
  drawings: ChartDrawingDto[]
}
