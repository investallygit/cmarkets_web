import type { CurvePointDto, StandardTenor } from '@/shared/api/contracts'

/** The standard tenors of block B and their times in years, as CMarket.Api reads them. */
export const TENOR_YEARS: Readonly<Record<StandardTenor, number>> = {
  '3M': 0.25,
  '6M': 0.5,
  '1Y': 1,
  '2Y': 2,
  '3Y': 3,
  '5Y': 5,
  '7Y': 7,
  '10Y': 10,
}

/** "cmkt-CM": the id of CMarket's curve of a country in GET /curves. */
export function cmarketCurveId(country: string): string {
  return `cmkt-${country}`
}

type Point = Pick<CurvePointDto, 'years' | 'ratePct'>

/**
 * The rate in percent at a time on a zero-coupon curve (spec section 14.1, fifth version): linear
 * between the two points around it, the first point's rate before it and the last's after it;
 * null without points. The server prices with the same reading.
 */
export function rateAt(points: readonly Point[], years: number): number | null {
  const sorted = [...points].sort((left, right) => left.years - right.years)
  const first = sorted.at(0)
  const last = sorted.at(-1)
  if (!first || !last) return null
  if (years <= first.years) return first.ratePct
  if (years >= last.years) return last.ratePct
  const after = sorted.findIndex((point) => point.years >= years)
  const left = sorted[after - 1]!
  const right = sorted[after]!
  if (right.years === left.years) return right.ratePct
  return (
    left.ratePct +
    ((right.ratePct - left.ratePct) * (years - left.years)) / (right.years - left.years)
  )
}
