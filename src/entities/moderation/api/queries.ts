import { useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import type { ModerationItemDto } from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'

export type ModerationKind = ModerationItemDto['kind']

export const moderationKeys = {
  all: [...ADMIN_QUERY_ROOT, 'moderation'] as const,
  queue: (kind: ModerationKind | null) => [...moderationKeys.all, 'queue', kind] as const,
  publication: (id: string) => [...moderationKeys.all, 'publication', id] as const,
  reports: () => [...moderationKeys.all, 'reports'] as const,
}

/** GET /admin/publications?status=pending|reported: the reports first, then those waiting. */
export function useModerationQueue(kind: ModerationKind | null = null) {
  return useQuery({
    queryKey: moderationKeys.queue(kind),
    queryFn: ({ signal }) => adminApi.moderationQueue(kind, signal),
  })
}

/** GET /admin/publications/{id}: the whole text as readers see it, or will once approved. */
export function useModeratedPublication(id: string | null) {
  return useQuery({
    queryKey: moderationKeys.publication(id ?? ''),
    queryFn: ({ signal }) => adminApi.moderatedPublication(id ?? '', signal),
    enabled: id !== null,
  })
}

/** POST /admin/publications/{id}/approve: one waiting goes live, a reported one stays. */
export function useApprovePublication() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.approvePublication,
    onSuccess: refresh,
  })
}

/** POST /admin/publications/{id}/takedown, with the reason the analyst reads. */
export function useTakeDownPublication() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.takeDownPublication(id, reason),
    onSuccess: refresh,
  })
}
