import type { CalendarEventDto, CalendarNoteDto } from '@/shared/api/contracts'
import { addDays, addMonths, startOfWeek } from '@/shared/lib/isoDate'

/** CAL's views: a day, a week from Monday, a list of two weeks from the day, a calendar month. */
export type CalendarView = 'day' | 'week' | 'list' | 'month'

export const CALENDAR_VIEWS: readonly CalendarView[] = ['day', 'week', 'list', 'month']

/** The list's two weeks. */
const LIST_DAYS = 14

/** First and last day a view shows around a day. */
export function rangeOf(view: CalendarView, date: string): { from: string; to: string } {
  switch (view) {
    case 'day':
      return { from: date, to: date }
    case 'week': {
      const from = startOfWeek(date)
      return { from, to: addDays(from, 6) }
    }
    case 'list':
      return { from: date, to: addDays(date, LIST_DAYS - 1) }
    case 'month': {
      const from = `${date.slice(0, 7)}-01`
      return { from, to: addDays(addMonths(from, 1), -1) }
    }
  }
}

/** The day the previous or next page of a view starts from. */
export function stepOf(view: CalendarView, date: string, step: 1 | -1): string {
  switch (view) {
    case 'day':
      return addDays(date, step)
    case 'week':
      return addDays(date, 7 * step)
    case 'list':
      return addDays(date, LIST_DAYS * step)
    case 'month':
      return addMonths(`${date.slice(0, 7)}-01`, step)
  }
}

/** A day of the agenda: its events in the server's order (by time, the whole day last) and its notes. */
export interface AgendaDay {
  date: string
  events: CalendarEventDto[]
  notes: CalendarNoteDto[]
}

/** The agenda by day, oldest first: a day with events or a note; a day without either is left out. */
export function groupByDay(
  events: readonly CalendarEventDto[],
  notes: readonly CalendarNoteDto[] = [],
): AgendaDay[] {
  const days = new Map<string, AgendaDay>()
  const day = (date: string) => {
    let found = days.get(date)
    if (!found) {
      found = { date, events: [], notes: [] }
      days.set(date, found)
    }
    return found
  }
  for (const event of events) day(event.date).events.push(event)
  for (const note of notes) day(note.date).notes.push(note)
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}
