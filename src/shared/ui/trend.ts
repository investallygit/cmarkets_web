export type TrendDirection = 'up' | 'down' | 'flat'

export function trendOf(value: number): TrendDirection {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

/** Green for a rise, red for a fall (spec section 8). */
export const TREND_TEXT: Record<TrendDirection, string> = {
  up: 'text-up',
  down: 'text-down',
  flat: 'text-primary',
}
