import type { CurrencyCode, IsoDate, IsoDateTime } from './common'

/** GET /rates/policy (BEAC rates, in %). */
export interface PolicyRateDto {
  id: string
  name: string
  value: number
  /** Change in percentage points since the previous decision. */
  change: number
  asOf: IsoDate
}

/** GET /fx?pairs=EURXAF,USDXAF */
export interface FxRateDto {
  pair: string
  base: CurrencyCode
  quote: CurrencyCode
  value: number
  changePct: number
  /** EUR/XAF is pegged at 655.957. */
  isFixed: boolean
  decimals: number
  timestamp: IsoDateTime
}

/**
 * Where a rate series comes from (spec section 11): EODHD's sovereign yields (`US10Y.GBOND`), its
 * money market rates (`EURIBOR3M.MONEY`), or the CEMAC states' yields the Data admin uploads
 * (`CMR5Y.CMKT`).
 */
export type RateOrigin = 'gbond' | 'money' | 'cmkt'

/**
 * What a CEMAC sovereign yield is: the weighted average rate of a BEAC auction, a trade or quote of
 * the secondary market (RFQ agreements included), or a computed point.
 */
export type RatePointType = 'auction' | 'secondary' | 'model'

/** Who gave a CEMAC sovereign yield. */
export type RatePointSource = 'beac' | 'crct' | 'svt' | 'bvmac' | 'cmarket'

/**
 * A point of a rate series, in percent. A CEMAC yield also says what it is, the security it is read
 * on (a CRCT code or an ISIN) and who gave it; a series of EODHD has none of them.
 */
export interface RatePointDto {
  date: IsoDate
  value: number
  pointType: RatePointType | null
  referenceSecurity: string | null
  source: RatePointSource | null
}

/**
 * GET /rates/series?origin=&country= and GET /macro/global-rates?set=: a series with its latest
 * point and its change since the point before (a day for EODHD's series, the previous auction or
 * trade for a CEMAC yield, whose points are irregular).
 */
export interface RateSeriesDto {
  /** "US10Y.GBOND", "EURIBOR3M.MONEY", "CMR5Y.CMKT". */
  code: string
  origin: RateOrigin
  /** ISO 3166-1 alpha-2; null for a rate of the euro area. */
  country: string | null
  /** As the code writes it: "13W", "3M", "10Y". */
  tenor: string
  nameFr: string
  nameEn: string
  /** Null before a first load or file. */
  last: RatePointDto | null
  previousDate: IsoDate | null
  /** In basis points. */
  changeBp: number | null
  /** A CEMAC yield older than the age the Admin sets for a curve point (90 days by default). */
  stale: boolean
}

/** GET /rates/{code}/history?from=&to=: the points of a series, oldest first. */
export interface RateHistoryDto {
  code: string
  points: RatePointDto[]
}

/**
 * The sets of GET /macro/global-rates: screen 25's sovereign and reference rates (a CEMAC yield a
 * state, then the world's 10-year yields and the 3-month Euribor), screen 26's euro benchmarks.
 */
export type GlobalRatesSet = 'world' | 'euro'
