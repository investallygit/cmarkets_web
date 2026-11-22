import type { CalendarEventType } from './calendar'
import type { CurrencyCode, DataSource, IsoDate, IsoDateTime } from './common'
import type { HistoryPointDto } from './market'

/** A commodity is a security too (ROADMAP decision 19): the search, DES, the lists and the alerts hold it. */
export type SecurityType = 'equity' | 'bond' | 'etf' | 'commodity'

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

/** Who wrote a commodity's description: the Data admin (CORR), or EODHD for the European and US securities. */
export type DescriptionSource = 'dataAdmin' | 'eodhd'

/** A commodity's description in one language. */
export interface DescriptionTextDto {
  /** 1,500 characters at most; paragraphs apart by a blank line, lines by a line feed. */
  text: string
  source: DescriptionSource
  updatedAt: IsoDateTime
}

/**
 * A commodity's description (screen 21): in each language CMarket's latest text, else EODHD's
 * English; null in a language without text, which the profile fills with the other, marked. The
 * securities' and the indices' have their own route (fifth version).
 */
export interface SecurityDescriptionDto {
  fr: DescriptionTextDto | null
  en: DescriptionTextDto | null
}

/** The languages a description is written in. */
export type DescriptionLanguage = 'fr' | 'en'

/** Who wrote a description: CMarket (the Data admin, an Analyst of CMarket, the file), or EODHD. */
export type DescriptionOrigin = 'cmarket' | 'eodhd'

/**
 * GET /securities/{id}/description?lang= and /indices/{code}/description?lang= (spec section 9,
 * screens 2, 3 and 31, fifth version): the latest version in the language asked, else in the
 * other one; CMarket's text, else EODHD's English. 404 when none is written.
 */
export interface DescriptionDto {
  /** The language of the text given, which may be the other one. */
  language: DescriptionLanguage
  /** 1,500 characters at most; paragraphs apart by a blank line, lines by a line feed. */
  text: string
  origin: DescriptionOrigin
  /** What it was written from, as its writer cites it ("Issuer's 2025 annual report"). */
  source: string | null
  updatedAt: IsoDateTime
  /** The languages written, the one given included. */
  languages: DescriptionLanguage[]
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
  /**
   * The sessions with trades over the last three months, the liquidity the key data shows ("58 of
   * 63", fifth version): BVMAC trades at a fixing, and a session without trades has no price.
   */
  sessionsTraded3m: number
  /** The sessions the exchange held over those three months. */
  sessions3m: number
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
 * GET /securities/{id}/quote, example response in spec section 10: the last fixing and the previous
 * one (fifth version), with the session's open, high and low, the fixing price for BVMAC.
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
  /** The value traded in the session, in the security's currency. */
  value: number
  marketCap: number
  source: DataSource
  isDelayed: boolean
  timestamp: IsoDateTime
  sessionDate: IsoDate
  /** The session of `last`: the quote's own when it traded, else the last that did. */
  fixingDate: IsoDate
}

/** A session with trades: its price (the fixing for BVMAC), changed from the session before. */
export interface SessionPriceDto {
  session: IsoDate
  price: number
  change: number
  changePct: number
  volume: number
  /** Value traded, in the security's currency. */
  value: number
}

/**
 * GET /securities/{id}/sessions?last=: the latest sessions with trades, newest first, in place of
 * the order book and the trades (spec section 9, screen 2, fifth version).
 */
export interface SecuritySessionsDto {
  items: SessionPriceDto[]
  /** The latest session over the span listed without trades, which the panel names. */
  lastWithoutTrades: IsoDate | null
}

/** GET /securities/{id}/dividends: newest first. */
export interface DividendDto {
  fiscalYear: number
  /** A fund's distribution for an ETF. */
  kind: 'final' | 'interim' | 'special' | 'distribution'
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
