import type { IsoDate } from './common'

/** An auction of the last 90 days, a BVMAC bond quote, or the weekly "Curves" file. */
export type CurvePointSource = 'auction' | 'quote' | 'file'

export interface YieldCurvePointDto {
  /** Maturity in years: 0.25 for 3 months. */
  years: number
  /** Annual compound yield, in percent (BTA rates are converted, spec section 14.1). */
  yieldPct: number
  source: CurvePointSource
}

/**
 * GET /yield-curves?country=&date=: the curve of the latest session on or before the date,
 * shortest maturity first. Without a country, every CEMAC country.
 */
export interface YieldCurveDto {
  country: string
  date: IsoDate
  points: YieldCurvePointDto[]
}
