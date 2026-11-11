import { useMutation, useQuery } from '@tanstack/react-query'
import { useRefreshAdminData } from '@/shared/api'
import type { NewsType } from '@/shared/api/contracts'
import { adminApi, type NewsQueueQuery } from '@/shared/api/endpoints'
import { moderationKeys } from './queries'

const newsKeys = {
  queue: (query: NewsQueueQuery) => [...moderationKeys.all, 'news', 'queue', query] as const,
  item: (id: string) => [...moderationKeys.all, 'news', 'item', id] as const,
}

/** GET /admin/news?status=&channel=&sourceId=: the reported items first, then those waiting. */
export function useNewsQueue(query: NewsQueueQuery = {}) {
  return useQuery({
    queryKey: newsKeys.queue(query),
    queryFn: ({ signal }) => adminApi.newsQueue(query, signal),
  })
}

/** GET /admin/news/{id}: the item as readers see it, or will once approved, with its reports. */
export function useModeratedNews(id: string | null) {
  return useQuery({
    queryKey: newsKeys.item(id ?? ''),
    queryFn: ({ signal }) => adminApi.moderatedNews(id ?? '', signal),
    enabled: id !== null,
  })
}

/** POST /admin/news/{id}/approve: one waiting goes live, a reported one stays. */
export function useApproveNews() {
  const refresh = useRefreshAdminData()
  return useMutation({ mutationFn: adminApi.approveNews, onSuccess: refresh })
}

/** POST /admin/news/{id}/takedown, with the reason its newspaper reads. */
export function useTakeDownNews() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.takeDownNews(id, reason),
    onSuccess: refresh,
  })
}

/** POST /admin/news/{id}/retype: ARTICLE to FLASH, or back. */
export function useRetypeNews() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: NewsType }) => adminApi.retypeNews(id, type),
    onSuccess: refresh,
  })
}
