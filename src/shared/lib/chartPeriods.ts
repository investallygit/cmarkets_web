import type { HistoryInterval } from '@/shared/api/contracts'
import { toMarketDay } from './format'

/** Chart periods, 1D to 5Y (spec section 9). */
export const CHART_PERIODS = ['1D', '5D', '1M', '6M', '1Y', '5Y'] as const
export type ChartPeriod = (typeof CHART_PERIODS)[number]

const DAY_MS = 86_400_000

const PERIODS: Record<ChartPeriod, { days: number; interval: HistoryInterval }> = {
  '1D': { days: 1, interval: '5m' },
  '5D': { days: 7, interval: '30m' },
  '1M': { days: 31, interval: '1d' },
  '6M': { days: 183, interval: '1d' },
  '1Y': { days: 366, interval: '1d' },
  '5Y': { days: 5 * 366, interval: '1w' },
}

export type PeriodRange = { from: string; to: string; interval: HistoryInterval }

/** Query parameters of the history endpoints for a period ending now. */
export function periodRange(period: ChartPeriod, now = Date.now()): PeriodRange {
  const { days, interval } = PERIODS[period]
  return { from: toMarketDay(now - days * DAY_MS), to: toMarketDay(now), interval }
}

export function isIntraday(period: ChartPeriod): boolean {
  return PERIODS[period].interval.endsWith('m')
}
