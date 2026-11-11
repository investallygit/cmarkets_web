import type { BondAnalyticsDayDto, IsoDate } from '@/shared/api/contracts'
import { addMonths } from '@/shared/lib/isoDate'
import type { TwoAxisPoint } from '@/shared/ui/charts/TwoAxisChart'

/** Screen 20's periods, 1Y by default: the mockup's. */
export const HISTORY_PERIODS = ['6M', '1Y', '3Y', 'MAX'] as const
export type HistoryPeriod = (typeof HISTORY_PERIODS)[number]

/** What the chart shows on its left axis: the clean price (with the YTM on the right), the yields or the spread. */
export const HISTORY_SERIES = ['price', 'yield', 'spread'] as const
export type HistorySeries = (typeof HISTORY_SERIES)[number]

const MONTHS: Record<Exclude<HistoryPeriod, 'MAX'>, number> = { '6M': 6, '1Y': 12, '3Y': 36 }

/** The period's first day: so many months before today, or the bond's issue for MAX. */
export function periodStart(period: HistoryPeriod, today: IsoDate, issueDate: IsoDate): IsoDate {
  return period === 'MAX' ? issueDate : addMonths(today, -MONTHS[period])
}

/**
 * The days as the chart draws them: price, the clean price and the YTM; yield, the YTM and the
 * YTW; spread, the credit spread alone. A model price's day is faint; a day without a trade has
 * no volume bar.
 */
export function historyPoints(
  days: readonly BondAnalyticsDayDto[],
  series: HistorySeries,
): TwoAxisPoint[] {
  return days.map((day) => ({
    time: day.date,
    primary:
      series === 'price' ? day.cleanPrice : series === 'yield' ? day.ytmPct : day.creditSpreadBp,
    secondary: series === 'price' ? day.ytmPct : series === 'yield' ? day.ytwPct : null,
    faint: day.priceSource === 'model',
    volume: day.volume,
  }))
}

/** For the words of the chart: the first and last values, the range, the traded and model days. */
export function historySummary(points: readonly TwoAxisPoint[]) {
  const values = points.flatMap((point) => (point.primary === null ? [] : [point.primary]))
  const first = values.at(0)
  const last = values.at(-1)
  if (first === undefined || last === undefined) return null
  return {
    from: points[0].time,
    to: points[points.length - 1].time,
    first,
    last,
    low: Math.min(...values),
    high: Math.max(...values),
    traded: points.filter((point) => point.volume !== null).length,
    model: points.filter((point) => point.faint).length,
  }
}
