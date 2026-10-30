import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { CalendarEventDto, CalendarEventType } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'

const WEEK_MS = 7 * 86_400_000

export interface CalendarQuery {
  from: string
  to: string
  /** All types when empty. */
  types?: readonly CalendarEventType[]
  /** A country keeps the regional events too. */
  country?: string
}

export const calendarKeys = {
  all: ['calendar'] as const,
  nextSevenDays: () => [...calendarKeys.all, 'next-7-days'] as const,
  range: (query: CalendarQuery) => [...calendarKeys.all, 'range', query] as const,
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: calendarKeys.nextSevenDays(),
    queryFn: ({ signal }) => {
      const now = Date.now()
      return apiClient.get<CalendarEventDto[]>('/calendar', {
        query: { from: toMarketDay(now), to: toMarketDay(now + WEEK_MS) },
        signal,
      })
    },
    staleTime: 5 * 60_000,
  })
}

/** GET /calendar for a day or a week of the CAL screen; the previous range stays while loading. */
export function useCalendarEvents(query: CalendarQuery, { enabled = true } = {}) {
  return useQuery({
    queryKey: calendarKeys.range(query),
    queryFn: ({ signal }) =>
      apiClient.get<CalendarEventDto[]>('/calendar', {
        query: { from: query.from, to: query.to, type: query.types, country: query.country },
        signal,
      }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}
