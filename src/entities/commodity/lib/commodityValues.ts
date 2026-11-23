import type {
  CommodityFrequency,
  CommodityHistoryPointDto,
  CommodityUnit,
} from '@/shared/api/contracts'

/** The list's badge: D daily, W weekly, M monthly (spec section 9). */
export const FREQUENCY_LETTERS: Record<CommodityFrequency, string> = {
  daily: 'D',
  weekly: 'W',
  monthly: 'M',
}

/** The intervals of the history, in the mockup's order. */
export const COMMODITY_INTERVALS: readonly CommodityFrequency[] = ['daily', 'weekly', 'monthly']

/** The history's periods (spec section 9: "periods 1 year to MAX"), 5Y as on the mockup by default. */
export const COMMODITY_PERIODS = ['1Y', '5Y', '10Y', 'MAX'] as const
export type CommodityPeriod = (typeof COMMODITY_PERIODS)[number]

/** The comparison's periods: its monthly values over 1, 5 or 10 years, or all of them. */
export const COMPARISON_PERIODS = ['1Y', '5Y', '10Y', 'MAX'] as const
export type ComparisonPeriod = (typeof COMPARISON_PERIODS)[number]

/** The most series CMP compares (spec section 9). */
export const MAX_COMPARED = 5

/**
 * The decimals a value is written with: a price under 10 with three ("0.712"), under 1,000 with
 * two ("81.40"), above with none ("9,412"); an index with one ("171.2").
 */
export function commodityDecimals(value: number, unit: CommodityUnit): number {
  if (unit === 'INDEX_2016' || unit === 'INDEX_1982') return 1
  const size = Math.abs(value)
  if (size >= 1_000) return 0
  if (size >= 10) return 2
  return 3
}

/** The history's period at first, the mockup's. */
export const DEFAULT_COMMODITY_PERIOD: CommodityPeriod = '5Y'

/** The first day of a period that ends on `last` (ISO dates); null for MAX, the whole history. */
export function periodStart(
  period: CommodityPeriod | ComparisonPeriod,
  last: string,
): string | null {
  const years = { '1Y': 1, '5Y': 5, '10Y': 10, MAX: null }[period]
  if (years === null) return null
  const [year, month, day] = last.split('-').map(Number)
  const start = new Date(Date.UTC(year - years, month - 1, day))
  return start.toISOString().slice(0, 10)
}

/** The history's values from a day on (all of them without one). */
export function pointsFrom(
  points: readonly CommodityHistoryPointDto[],
  from: string | null,
): CommodityHistoryPointDto[] {
  return from === null ? [...points] : points.filter((point) => point.date >= from)
}
