import type { FxInterval } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'

const DAY_MS = 86_400_000

/**
 * The periods of screen 26's chart, "from 1 month to MAX" (spec section 9), the mockup's: each
 * publication up to a year, each week's last beyond, as the index charts' long periods.
 */
const PERIODS = {
  '1M': { days: 31, interval: '1d' },
  '6M': { days: 183, interval: '1d' },
  '1Y': { days: 366, interval: '1d' },
  '5Y': { days: 5 * 366, interval: '1w' },
  MAX: { days: null, interval: '1w' },
} as const satisfies Record<string, { days: number | null; interval: FxInterval }>

export type FxPeriod = keyof typeof PERIODS

export const FX_PERIODS = ['1M', '6M', '1Y', '5Y', 'MAX'] as const satisfies readonly FxPeriod[]

/** The query of a period ending today, a day of Douala; MAX from the ECB's first rates (1999). */
export function fxPeriodRange(
  period: FxPeriod,
  now = Date.now(),
): { from?: string; interval: FxInterval } {
  const { days, interval } = PERIODS[period]
  return days === null ? { interval } : { from: toMarketDay(now - days * DAY_MS), interval }
}
