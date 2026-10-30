import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { AnalystDto, FollowResultDto } from '@/shared/api/contracts'

export const analystKeys = {
  all: ['analysts'] as const,
  detail: (id: string) => [...analystKeys.all, id] as const,
}

/** GET /analysts/{id}: the public profile and the history of the analyst's ratings. */
export function useAnalyst(id: string | null | undefined) {
  return useQuery({
    queryKey: analystKeys.detail(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<AnalystDto>(`/analysts/${encodeURIComponent(id ?? '')}`, { signal }),
    enabled: Boolean(id),
  })
}

/** POST / DELETE /analysts/{id}/follow */
export function useFollowAnalyst(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (follow: boolean) => {
      const path = `/analysts/${encodeURIComponent(id)}/follow`
      return follow
        ? apiClient.post<FollowResultDto>(path)
        : apiClient.delete<FollowResultDto>(path)
    },
    onSuccess: (result) =>
      queryClient.setQueryData<AnalystDto>(
        analystKeys.detail(id),
        (analyst) => analyst && { ...analyst, ...result },
      ),
  })
}
