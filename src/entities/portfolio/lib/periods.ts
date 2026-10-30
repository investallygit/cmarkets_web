import { addMonths } from '@/shared/lib/isoDate'

/** Ranges of the performance chart of the screen 5 mockup: YTD · 1Y · 3Y · INCEPTION. */
export const PERFORMANCE_RANGES = ['ytd', '1y', '3y', 'inception'] as const
export type PerformanceRange = (typeof PERFORMANCE_RANGES)[number]

/**
 * The `from` of GET .../performance for a range; the server starts from the last valuation on or
 * before it: YTD from the last one of the previous year (spec section 14.2), null since inception.
 */
export function rangeFrom(range: PerformanceRange, today: string): string | null {
  switch (range) {
    case 'ytd':
      return `${Number(today.slice(0, 4)) - 1}-12-31`
    case '1y':
      return addMonths(today, -12)
    case '3y':
      return addMonths(today, -36)
    case 'inception':
      return null
  }
}
