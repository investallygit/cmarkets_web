import type { CalendarView } from '@/entities/calendar-event'
import type { CalendarEventType } from '@/shared/api/contracts'

/** What CAL shows (screen 32, sixth version); the page keeps it in the URL. */
export interface CalendarState {
  view: CalendarView
  /** The day shown, or any day of the week or month shown, or the list's first. */
  date: string
  types: readonly CalendarEventType[]
  /** The CEMAC states, two letters; empty for all of them. */
  countries: readonly string[]
  /** Only the events of the user's portfolios and watchlists. */
  mine: boolean
  /** The event picked, its detail on the right. */
  event: string | null
}

export type CalendarStateChange = Partial<CalendarState>
