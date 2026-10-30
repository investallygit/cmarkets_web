import { CALENDAR_EVENT_TYPES } from '@/entities/calendar-event'
import { isCemacCountry } from '@/shared/config/countries'
import type { CalendarViewState } from '@/widgets/calendar-view-panel'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** ?view=day&date=2026-11-02&types=auction,dividend&country=CM, with the defaults left out. */
export function readCalendarParams(params: URLSearchParams, today: string): CalendarViewState {
  const date = params.get('date') ?? ''
  const types = params.get('types')?.split(',')
  const country = params.get('country') ?? ''
  return {
    view: params.get('view') === 'day' ? 'day' : 'week',
    date: ISO_DATE.test(date) ? date : today,
    types: types
      ? CALENDAR_EVENT_TYPES.filter((type) => types.includes(type))
      : CALENDAR_EVENT_TYPES,
    country: isCemacCountry(country) ? country : '',
  }
}

export function writeCalendarParams(state: CalendarViewState, today: string): URLSearchParams {
  const params = new URLSearchParams()
  if (state.view === 'day') params.set('view', 'day')
  if (state.date !== today) params.set('date', state.date)
  if (state.types.length !== CALENDAR_EVENT_TYPES.length) params.set('types', state.types.join(','))
  if (state.country) params.set('country', state.country)
  return params
}
