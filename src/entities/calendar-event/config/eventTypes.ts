import type { CalendarEventType } from '@/shared/api/contracts'

/** The nine types of CAL in the order of its filters (screen 32, sixth version). */
export const CALENDAR_EVENT_TYPES: readonly CalendarEventType[] = [
  'auction',
  'result',
  'redemption',
  'dividend',
  'meeting',
  'earnings',
  'beac',
  'statistic',
  'international',
]

/** The types shown at first: EODHD's international events wait for a click, as the mockup. */
export const DEFAULT_EVENT_TYPES: readonly CalendarEventType[] = CALENDAR_EVENT_TYPES.filter(
  (type) => type !== 'international',
)

/**
 * The colour of each type, a section 8 token as the mockup's badges: auctions amber, results
 * green, redemptions violet, dividends blue, meetings teal, releases blue, the BEAC red, the
 * statistics pink, the international events grey.
 */
export const EVENT_TYPE_COLORS: Readonly<Record<CalendarEventType, string>> = {
  auction: 'var(--accent-amber)',
  result: 'var(--up)',
  redemption: 'var(--chart-7)',
  dividend: 'var(--info)',
  meeting: 'var(--chart-3)',
  earnings: 'var(--chart-1)',
  beac: 'var(--down)',
  statistic: 'var(--chart-5)',
  international: 'var(--text-secondary)',
}

/** The types an alert can follow on the user's securities. */
export const SECURITY_EVENT_TYPES: readonly CalendarEventType[] = [
  'redemption',
  'dividend',
  'meeting',
  'earnings',
]

/** The types told when published (results, decisions), not days before. */
export const PUBLISHED_EVENT_TYPES: readonly CalendarEventType[] = ['result', 'beac']
