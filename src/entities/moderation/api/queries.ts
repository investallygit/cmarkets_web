import { useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, apiClient, useRefreshAdminData } from '@/shared/api'
import type { LibraryPublicationDto, ModerationItemDto } from '@/shared/api/contracts'

export type ModerationKind = ModerationItemDto['kind']

export const moderationKeys = {
  all: [...ADMIN_QUERY_ROOT, 'moderation'] as const,
  queue: (kind: ModerationKind | null) => [...moderationKeys.all, 'queue', kind] as const,
  publication: (id: string) => [...moderationKeys.all, 'publication', id] as const,
  reports: () => [...moderationKeys.all, 'reports'] as const,
}

const publicationPath = (id: string, action = '') =>
  `/admin/publications/${encodeURIComponent(id)}${action && `/${action}`}`

/** GET /admin/publications?status=pending|reported: the reports first, then those waiting. */
export function useModerationQueue(kind: ModerationKind | null = null) {
  return useQuery({
    queryKey: moderationKeys.queue(kind),
    queryFn: ({ signal }) =>
      apiClient.get<ModerationItemDto[]>('/admin/publications', {
        query: { status: kind },
        signal,
      }),
  })
}

/** GET /admin/publications/{id}: the whole text as readers see it, or will once approved. */
export function useModeratedPublication(id: string | null) {
  return useQuery({
    queryKey: moderationKeys.publication(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<LibraryPublicationDto>(publicationPath(id ?? ''), { signal }),
    enabled: id !== null,
  })
}

/** POST /admin/publications/{id}/approve: one waiting goes live, a reported one stays. */
export function useApprovePublication() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (id: string) => apiClient.post<void>(publicationPath(id, 'approve')),
    onSuccess: refresh,
  })
}

/** POST /admin/publications/{id}/takedown, with the reason the analyst reads. */
export function useTakeDownPublication() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<void>(publicationPath(id, 'takedown'), { reason }),
    onSuccess: refresh,
  })
}
