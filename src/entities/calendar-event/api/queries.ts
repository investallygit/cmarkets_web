import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { CalendarEventDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'

const WEEK_MS = 7 * 86_400_000

export const calendarKeys = {
  all: ['calendar'] as const,
  nextSevenDays: () => [...calendarKeys.all, 'next-7-days'] as const,
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
