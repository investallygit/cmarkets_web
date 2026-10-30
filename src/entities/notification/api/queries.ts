import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { apiClient } from '@/shared/api'
import type { NotificationDto, Paged } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/useNow'

export const notificationKeys = { all: ['notifications'] as const }

/** GET /notifications: the alerts that went off, newest first. */
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

/** POST /notifications/{id}/read: the "ALERTS n" counter of the top bar goes down at once. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<void>(`/notifications/${encodeURIComponent(id)}/read`),
    onSuccess: (_result, id) =>
      queryClient.setQueryData<Paged<NotificationDto>>(
        notificationKeys.all,
        (page) =>
          page && {
            ...page,
            items: page.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
          },
      ),
  })
}
