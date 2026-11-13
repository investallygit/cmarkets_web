import type { IsoDate } from './common'
import type { RatePointSource, RatePointType } from './rates'

/**
 * An auction of the last 90 days, a BVMAC bond's close, or the latest point of the country's series
 * at that tenor (the CEMAC sovereign yields file, spec section 11).
 */
export type CurvePointSource = 'auction' | 'quote' | 'series'

/** A point of a country's series on a curve: what the screen 4 tooltip says of it. */
export interface CurveSeriesPointDto {
  /** "CMR5Y.CMKT". */
  code: string
  pointType: RatePointType
  /** A CRCT code or an ISIN. */
  referenceSecurity: string | null
  source: RatePointSource
}

export interface YieldCurvePointDto {
  /** Maturity in years: 0.25 for 3 months. */
  years: number
  /** Annual compound yield, in percent (BTA rates are converted, spec section 14.1). */
  yieldPct: number
  source: CurvePointSource
  /** The day of the auction, of the close or of the series' point. */
  asOf: IsoDate
  /** Older, on the curve's date, than the age the Admin sets (90 days by default). */
  stale: boolean
  /** For a point of the country's series. */
  series: CurveSeriesPointDto | null
}

/**
 * GET /yield-curves?country=&date=: the curve of the latest session on or before the date,
 * shortest maturity first. Without a country, every CEMAC country.
 */
export interface YieldCurveDto {
  country: string
  date: IsoDate
  /** The age beyond which a point is stale, as the Admin set it in ADMCFG. */
  staleAfterDays: number
  points: YieldCurvePointDto[]
}
