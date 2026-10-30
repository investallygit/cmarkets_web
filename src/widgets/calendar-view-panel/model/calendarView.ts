import type { CalendarEventType } from '@/shared/api/contracts'
import { addDays, startOfWeek } from '@/shared/lib/isoDate'

export type CalendarView = 'day' | 'week'

/** What the CAL screen shows; the page keeps it in the URL. */
export interface CalendarViewState {
  view: CalendarView
  /** The day shown, or any day of the week shown. */
  date: string
  /** The event types shown. */
  types: readonly CalendarEventType[]
  /** '' for every country. */
  country: string
}

/** A change of the view, or a function of the current view when it depends on it (next week). */
export type CalendarViewChange =
  Partial<CalendarViewState> | ((current: CalendarViewState) => Partial<CalendarViewState>)

/** First and last day shown: Monday to Sunday in the week view. */
export function visibleRange({ view, date }: Pick<CalendarViewState, 'view' | 'date'>) {
  if (view === 'day') return { from: date, to: date }
  const from = startOfWeek(date)
  return { from, to: addDays(from, 6) }
}

/** The previous or next day or week. */
export function stepDate({ view, date }: Pick<CalendarViewState, 'view' | 'date'>, step: 1 | -1) {
  return addDays(date, view === 'day' ? step : 7 * step)
}
