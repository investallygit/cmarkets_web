import type { CalendarEventType } from '@/shared/api/contracts'
import type { BadgeTone } from '@/shared/ui/Badge'

/** The event types in the order of spec section 2. */
export const CALENDAR_EVENT_TYPES: readonly CalendarEventType[] = [
  'session',
  'auction',
  'dividend',
  'maturity',
  'meeting',
  'earnings',
]

/** One colour per type in the CAL screen; red marks a day without a session. */
export const EVENT_TYPE_TONES: Record<CalendarEventType, BadgeTone> = {
  session: 'down',
  auction: 'info',
  dividend: 'up',
  maturity: 'warning',
  meeting: 'neutral',
  earnings: 'amber',
}
