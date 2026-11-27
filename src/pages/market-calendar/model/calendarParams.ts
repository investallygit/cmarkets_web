import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_VIEWS,
  DEFAULT_EVENT_TYPES,
} from '@/entities/calendar-event'
import { isCemacCountry } from '@/shared/config/countries'
import type { CalendarState } from '@/widgets/calendar-panels'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const sameTypes = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((type) => b.includes(type))

/**
 * ?view=week&date=2026-11-12&types=auction,result&countries=CM,GA&mine=1&event=…, with the
 * defaults left out: the list from today, every type but the international, every state.
 */
export function readCalendarParams(params: URLSearchParams, today: string): CalendarState {
  const date = params.get('date') ?? ''
  const view = params.get('view')
  const types = params.get('types')?.split(',')
  const countries = (params.get('countries') ?? '').split(',').filter(isCemacCountry)
  return {
    view: CALENDAR_VIEWS.find((candidate) => candidate === view) ?? 'list',
    date: ISO_DATE.test(date) ? date : today,
    types: types
      ? CALENDAR_EVENT_TYPES.filter((type) => types.includes(type))
      : DEFAULT_EVENT_TYPES,
    countries,
    mine: params.get('mine') === '1',
    event: params.get('event') || null,
  }
}

export function writeCalendarParams(state: CalendarState, today: string): URLSearchParams {
  const params = new URLSearchParams()
  if (state.view !== 'list') params.set('view', state.view)
  if (state.date !== today) params.set('date', state.date)
  if (!sameTypes(state.types, DEFAULT_EVENT_TYPES)) params.set('types', state.types.join(','))
  if (state.countries.length > 0) params.set('countries', state.countries.join(','))
  if (state.mine) params.set('mine', '1')
  if (state.event) params.set('event', state.event)
  return params
}
