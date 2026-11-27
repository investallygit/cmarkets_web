import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CalendarEntryInputDto } from '@/shared/api/contracts'
import { contentApi, dataAdminApi, type CalendarRange } from '@/shared/api/endpoints'
import { toMarketDay } from '@/shared/lib/format'

const WEEK_MS = 7 * 86_400_000

export const calendarKeys = {
  all: ['calendar'] as const,
  nextSevenDays: () => [...calendarKeys.all, 'next-7-days'] as const,
  range: (query: CalendarRange) => [...calendarKeys.all, 'range', query] as const,
  event: (id: string) => [...calendarKeys.all, 'event', id] as const,
  entries: (from: string, to: string) => [...calendarKeys.all, 'entries', from, to] as const,
}

/** MKT's calendar panel: the next seven days, every type but the international (screen 1). */
export function useUpcomingEvents() {
  return useQuery({
    queryKey: calendarKeys.nextSevenDays(),
    queryFn: ({ signal }) => {
      const now = Date.now()
      return contentApi.calendar({ from: toMarketDay(now), to: toMarketDay(now + WEEK_MS) }, signal)
    },
    staleTime: 5 * 60_000,
  })
}

/** GET /calendar for CAL's range and filters; the previous range stays while loading. */
export function useCalendar(query: CalendarRange) {
  return useQuery({
    queryKey: calendarKeys.range(query),
    queryFn: ({ signal }) => contentApi.calendar(query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /calendar/{id}: the event picked and what its detail adds. */
export function useCalendarEvent(id: string | null) {
  return useQuery({
    queryKey: calendarKeys.event(id ?? ''),
    queryFn: ({ signal }) => contentApi.calendarEvent(id ?? '', signal),
    enabled: id !== null,
    staleTime: 5 * 60_000,
  })
}

/** GET /data/calendar: the events the Data admin entered or loaded, for CORR. */
export function useCalendarEntries(from: string, to: string) {
  return useQuery({
    queryKey: calendarKeys.entries(from, to),
    queryFn: ({ signal }) => dataAdminApi.calendarEntries(from, to, signal),
  })
}

/** An event entered or corrected in CORR; every calendar query reads again. */
export function useSaveCalendarEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, entry }: { id: string | null; entry: CalendarEntryInputDto }) =>
      dataAdminApi.saveCalendarEntry(id, entry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  })
}

export function useDeleteCalendarEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dataAdminApi.deleteCalendarEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  })
}
