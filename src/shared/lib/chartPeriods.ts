import type { HistoryInterval } from '@/shared/api/contracts'
import { toMarketDay } from './format'

const DAY_MS = 86_400_000

/** Chart periods from intraday to 10 years (spec section 3) and the bars each one uses. */
const PERIODS = {
  '1D': { days: 1, interval: '5m' },
  '5D': { days: 7, interval: '30m' },
  '1M': { days: 31, interval: '1d' },
  '3M': { days: 92, interval: '1d' },
  '6M': { days: 183, interval: '1d' },
  '1Y': { days: 366, interval: '1d' },
  '5Y': { days: 5 * 366, interval: '1w' },
  '10Y': { days: 10 * 366, interval: '1w' },
} as const satisfies Record<string, { days: number; interval: HistoryInterval }>

export type ChartPeriod = keyof typeof PERIODS

/** Periods of the market dashboard chart, 1D to 5Y (spec section 9, screen 1). */
export const CHART_PERIODS = [
  '1D',
  '5D',
  '1M',
  '6M',
  '1Y',
  '5Y',
] as const satisfies readonly ChartPeriod[]

export type PeriodRange = { from: string; to: string; interval: HistoryInterval }

/** Query parameters of the history endpoints for a period ending now. */
export function periodRange(period: ChartPeriod, now = Date.now()): PeriodRange {
  const { days, interval } = PERIODS[period]
  return { from: toMarketDay(now - days * DAY_MS), to: toMarketDay(now), interval }
}

export function isIntraday(period: ChartPeriod): boolean {
  return PERIODS[period].interval.endsWith('m')
}
