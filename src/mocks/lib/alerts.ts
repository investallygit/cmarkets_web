import type { AlertCondition, AlertSeverity, SecurityType } from '@/shared/api/contracts'
import { formatNumber, formatPercent } from '@/shared/lib/format'

type PriceCondition = Extract<AlertCondition, { type: 'price' }>
type VolumeCondition = Extract<AlertCondition, { type: 'volume' }>

/** What a quote alert looks at, before and after a trade. */
export interface QuoteState {
  last: number
  changePct: number
  volume: number
}

/** The move from `before` to `after` crosses the threshold in the direction of the alert. */
export function crossesThreshold(
  condition: PriceCondition,
  before: QuoteState,
  after: QuoteState,
): boolean {
  const value = (state: QuoteState) => (condition.metric === 'price' ? state.last : state.changePct)
  return condition.direction === 'above'
    ? value(before) < condition.threshold && value(after) >= condition.threshold
    : value(before) > condition.threshold && value(after) <= condition.threshold
}

/** The session volume goes above `multiple` times the average volume. */
export function exceedsVolume(
  condition: VolumeCondition,
  before: QuoteState,
  after: QuoteState,
  averageVolume: number,
): boolean {
  const limit = condition.multiple * averageVolume
  return before.volume < limit && after.volume >= limit
}

/** Red for a fall or a breached portfolio limit, yellow for other market moves (spec section 9). */
export function severityOf(condition: AlertCondition): AlertSeverity {
  if (condition.type === 'price') return condition.direction === 'below' ? 'critical' : 'warning'
  if (condition.type === 'volume') return 'warning'
  if (condition.type === 'portfolio') return 'critical'
  return 'info'
}

/** The message of a quote alert, in the words of the screen 1 mockup: "Price above XAF 26,500". */
export function quoteAlertMessage(
  condition: PriceCondition | VolumeCondition,
  security: { type: SecurityType; currency: string },
): string {
  if (condition.type === 'volume') {
    return `Volume above ${condition.multiple}x the 20-day average`
  }
  if (condition.metric === 'changePct') {
    return `Change ${condition.direction} ${formatPercent(condition.threshold, 'en')} on the session`
  }
  // Bonds are quoted in percent of par, equities in their currency.
  const price =
    security.type === 'bond'
      ? formatNumber(condition.threshold, 'en', 2)
      : `${security.currency} ${formatNumber(condition.threshold, 'en', 0)}`
  return `Price ${condition.direction} ${price}`
}
