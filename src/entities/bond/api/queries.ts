import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { BondDto } from '@/shared/api/contracts'

export const bondKeys = {
  all: ['bonds'] as const,
  bond: (id: string) => [...bondKeys.all, id] as const,
}

/** GET /bonds/{id}: terms and cash-flow schedule. */
export function useBond(id: string, enabled = true) {
  return useQuery({
    queryKey: bondKeys.bond(id),
    queryFn: ({ signal }) => apiClient.get<BondDto>(`/bonds/${encodeURIComponent(id)}`, { signal }),
    staleTime: 5 * 60_000,
    enabled,
  })
}
