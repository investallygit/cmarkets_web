import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AnalystDto } from '@/shared/api/contracts'
import { researchApi } from '@/shared/api/endpoints'

export const analystKeys = {
  all: ['analysts'] as const,
  detail: (id: string) => [...analystKeys.all, id] as const,
}

/** GET /analysts/{id}: the public profile and the history of the analyst's ratings. */
export function useAnalyst(id: string | null | undefined) {
  return useQuery({
    queryKey: analystKeys.detail(id ?? ''),
    queryFn: ({ signal }) => researchApi.analyst(id ?? '', signal),
    enabled: Boolean(id),
  })
}

/** POST / DELETE /analysts/{id}/follow */
export function useFollowAnalyst(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (follow: boolean) => researchApi.follow(id, follow),
    onSuccess: (result) =>
      queryClient.setQueryData<AnalystDto>(
        analystKeys.detail(id),
        (analyst) => analyst && { ...analyst, ...result },
      ),
  })
}
