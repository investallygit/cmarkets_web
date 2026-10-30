import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { FxRateDto, PolicyRateDto } from '@/shared/api/contracts'

export const ratesKeys = {
  policy: ['rates', 'policy'] as const,
  fx: (pairs: readonly string[]) => ['fx', pairs.join(',')] as const,
}

export function usePolicyRates() {
  return useQuery({
    queryKey: ratesKeys.policy,
    queryFn: ({ signal }) => apiClient.get<PolicyRateDto[]>('/rates/policy', { signal }),
    staleTime: 60 * 60_000,
  })
}

export function useFxRates(pairs: readonly string[]) {
  return useQuery({
    queryKey: ratesKeys.fx(pairs),
    queryFn: ({ signal }) =>
      apiClient.get<FxRateDto[]>('/fx', { query: { pairs: pairs.join(',') }, signal }),
    refetchInterval: 60_000,
  })
}
