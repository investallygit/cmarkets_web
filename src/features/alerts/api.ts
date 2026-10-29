import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { apiClient } from '@/shared/api'
import type { NotificationDto, Paged } from '@/shared/api/contracts'
import { useNow } from '@/shared/hooks/useNow'
import { toMarketDay } from '@/shared/lib/format'
import { useRealtimeEvent } from '@/shared/realtime'

export const notificationKeys = { all: ['notifications'] as const }

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: ({ signal }) =>
      apiClient.get<Paged<NotificationDto>>('/notifications', {
        query: { page: 1, pageSize: 50 },
        signal,
      }),
    refetchInterval: 60_000,
  })
}

/** Notifications triggered today, in Douala time. */
export function useTodayNotifications() {
  const query = useNotifications()
  const today = toMarketDay(useNow(60_000))
  const items = useMemo(
    () =>
      query.data?.items.filter((notification) => toMarketDay(notification.triggeredAt) === today),
    [query.data, today],
  )
  return { query, items }
}

/** AlertTriggered refreshes the notification centre. Mounted once by the app shell. */
export function useAlertsRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('AlertTriggered', () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  })
}
