import type { EtfHistoryDayDto, EtfHistorySeries, IsoDate } from '@/shared/api/contracts'
import type { EtfHistoryQuery } from '@/shared/api/endpoints'
import { addMonths } from '@/shared/lib/isoDate'
import type { TwoAxisPoint } from '@/shared/ui/charts/TwoAxisChart'

/** Screen 19's price history: 1M to MAX, 1Y by default (the mockup's). */
export const PRICE_PERIODS = ['1M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const
export type PricePeriod = (typeof PRICE_PERIODS)[number]

/** PERF's total return against the index: a year to the fund's whole life. */
export const GROWTH_PERIODS = ['1Y', '3Y', '5Y', 'MAX'] as const
export type GrowthPeriod = (typeof GROWTH_PERIODS)[number]

const MONTHS: Record<Exclude<PricePeriod, 'MAX'>, number> = {
  '1M': 1,
  '6M': 6,
  '1Y': 12,
  '3Y': 36,
  '5Y': 60,
}

/** The longest history CMarket.Api gives (MAX for a fund without its inception date). */
const MAX_YEARS = 50

/**
 * A period's request: from so many months before today, or the fund's inception for MAX; by week
 * past three years, so that the chart stays readable and light.
 */
export function historyQuery(
  period: PricePeriod,
  today: IsoDate,
  inception: IsoDate | null,
  series: readonly EtfHistorySeries[],
): EtfHistoryQuery {
  const from =
    period === 'MAX'
      ? (inception ?? addMonths(today, -12 * MAX_YEARS))
      : addMonths(today, -MONTHS[period])
  return {
    from,
    to: today,
    interval: period === '5Y' || period === 'MAX' ? '1w' : '1d',
    with: series,
  }
}

/** The lines the price history shows: the price, the NAV, the volume below. */
export interface PriceLines {
  price: boolean
  nav: boolean
  volume: boolean
}

/**
 * The days as the price history draws them: the close (or the NAV alone when the price is off) as
 * the main line, the NAV beside it; the volume when shown.
 */
export function pricePoints(days: readonly EtfHistoryDayDto[], lines: PriceLines): TwoAxisPoint[] {
  return days.map((day) => ({
    time: day.date,
    primary: lines.price ? day.close : day.nav,
    secondary: lines.price && lines.nav ? day.nav : null,
    faint: false,
    volume: lines.volume ? day.volume : null,
  }))
}

/** PERF's lines: the total return from 100, the index on its scale. */
export function growthPoints(days: readonly EtfHistoryDayDto[]): TwoAxisPoint[] {
  return days.map((day) => ({
    time: day.date,
    primary: day.totalReturn,
    secondary: day.index,
    faint: false,
    volume: null,
  }))
}

/** For the words of a chart: its days, the first and last values of the main line, its range. */
export function lineSummary(points: readonly TwoAxisPoint[]) {
  const values = points.flatMap((point) => (point.primary === null ? [] : [point.primary]))
  const first = values.at(0)
  const last = values.at(-1)
  if (first === undefined || last === undefined) return null
  const others = points.flatMap((point) => (point.secondary === null ? [] : [point.secondary]))
  return {
    from: points[0].time,
    to: points[points.length - 1].time,
    first,
    last,
    low: Math.min(...values),
    high: Math.max(...values),
    otherLast: others.at(-1) ?? null,
  }
}
