import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/shared/api/endpoints'

export const ratesKeys = {
  policy: ['rates', 'policy'] as const,
  fx: (pairs: readonly string[]) => ['fx', pairs.join(',')] as const,
}

export function usePolicyRates() {
  return useQuery({
    queryKey: ratesKeys.policy,
    queryFn: ({ signal }) => marketApi.policyRates(signal),
    staleTime: 60 * 60_000,
  })
}

export function useFxRates(pairs: readonly string[]) {
  return useQuery({
    queryKey: ratesKeys.fx(pairs),
    queryFn: ({ signal }) => marketApi.fx(pairs, signal),
    refetchInterval: 60_000,
  })
}
