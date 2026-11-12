import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DescriptionWriteDto } from '@/shared/api/contracts'
import { dataAdminApi } from '@/shared/api/endpoints'
import { securityKeys } from './queries'

/** GET /data/securities/{id}/description (CORR): the texts stored, by who wrote them. */
export function useStoredDescription(securityId: string | null) {
  return useQuery({
    queryKey: securityKeys.description(securityId ?? ''),
    queryFn: ({ signal }) => dataAdminApi.description(securityId ?? '', signal),
    enabled: Boolean(securityId),
  })
}

/**
 * PUT /data/securities/{id}/description: the Data admin's French and English, an empty one
 * removed; the profile, which EQS reads, follows.
 */
export function useDescribeSecurity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      securityId,
      description,
    }: {
      securityId: string
      description: DescriptionWriteDto
    }) => dataAdminApi.describe(securityId, description),
    onSuccess: (stored) => {
      queryClient.setQueryData(securityKeys.description(stored.securityId), stored)
      return queryClient.invalidateQueries({ queryKey: securityKeys.profile(stored.securityId) })
    },
  })
}
