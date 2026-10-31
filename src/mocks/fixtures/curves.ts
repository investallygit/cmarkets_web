import type { AuctionDto, YieldCurveDto, YieldCurvePointDto } from '@/shared/api/contracts'
import type { CemacCountry } from '@/shared/config/countries'
import { addDays } from '@/shared/lib/isoDate'
import { btaCompoundYield } from '../lib/bondMath'
import { DAY_MS } from '../lib/time'

/** Maturities of the curves in years, 3M to 10Y as in the screen 4 mockup. */
export const CURVE_MATURITIES = [0.25, 0.5, 1, 2, 3, 5, 7, 10] as const

/**
 * The latest weekly "Curves" file of spec section 11: one rate per maturity above, close to the
 * screen 4 mockup. Congo and CAR start higher than in the mockup, to stay above their auctions.
 */
// prettier-ignore
export const CURVE_FILE: Record<CemacCountry, readonly number[]> = {
  CM: [4.6, 4.9, 5.3, 5.8, 6.2, 6.6, 6.9, 7.2],
  GA: [5.1, 5.5, 5.9, 6.4, 6.8, 7.3, 7.6, 7.9],
  CG: [5.8, 6.5, 6.8, 7.2, 7.6, 8.1, 8.4, 8.7],
  TD: [5.6, 6.0, 6.4, 6.9, 7.3, 7.8, 8.1, 8.3],
  CF: [6.0, 6.6, 7.0, 7.45, 7.85, 8.3, 8.6, 8.9],
  GQ: [5.3, 5.6, 6.1, 6.6, 7.0, 7.5, 7.8, 8.1],
}

/** The rates of a curves file published by the Data admin, by maturity above. */
export interface CurveFile {
  date: string
  rates: readonly (number | undefined)[]
}

/** Only auctions this recent make a point of the curve (spec section 14.1). */
const AUCTION_WINDOW_DAYS = 90

/** Rates have risen: 0.15 point lower a month earlier, as in the mockup's comparison. */
function fileShift(date: string, today: string): number {
  const daysAgo = Math.max(0, (Date.parse(today) - Date.parse(date)) / DAY_MS)
  return -0.15 * (daysAgo / 30) ** 0.7
}

function auctionYears(auction: AuctionDto): number {
  return auction.instrument === 'BTA' ? Math.round((auction.term / 52) * 4) / 4 : auction.term
}

/** BTA rates are simple interest on 360 days: converted before going on the curve. */
function auctionYield(auction: AuctionDto): number {
  return auction.instrument === 'BTA'
    ? btaCompoundYield(auction.averageRate, auction.term * 7)
    : auction.averageRate
}

/**
 * A country's curve on a session: the weighted average rate of the latest auction of the last
 * 90 days at each maturity, the curve file elsewhere. The prototype leaves out bond quotes.
 */
export function yieldCurve(
  country: CemacCountry,
  date: string,
  today: string,
  auctions: readonly AuctionDto[],
  published?: CurveFile,
): YieldCurveDto {
  // A curves file published on or before the date replaces the sample file from its day.
  const file = published
    ? CURVE_FILE[country].map((rate, index) => published.rates[index] ?? rate)
    : CURVE_FILE[country]
  const shift = published ? 0 : fileShift(date, today)
  const windowStart = addDays(date, -AUCTION_WINDOW_DAYS)
  const recent = auctions
    .filter((auction) => auction.country === country)
    .filter((auction) => auction.date > windowStart && auction.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date))

  const points = CURVE_MATURITIES.map((years, index): YieldCurvePointDto => {
    const auction = recent.find((candidate) => auctionYears(candidate) === years)
    return auction
      ? { years, yieldPct: Number(auctionYield(auction).toFixed(4)), source: 'auction' }
      : { years, yieldPct: Number((file[index] + shift).toFixed(4)), source: 'file' }
  })
  return { country, date, points }
}
