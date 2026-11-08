import { useQuery } from '@tanstack/react-query'
import { securitiesApi } from '@/shared/api/endpoints'

export const quoteKeys = {
  all: ['quotes'] as const,
  quote: (securityId: string) => [...quoteKeys.all, securityId] as const,
}

/**
 * GET /securities/{id}/quote: the snapshot behind the live values, with the session's open,
 * high and low. Real-time ticks update the price between two refreshes.
 */
export function useQuote(securityId: string) {
  return useQuery({
    queryKey: quoteKeys.quote(securityId),
    queryFn: ({ signal }) => securitiesApi.quote(securityId, signal),
    refetchInterval: 30_000,
  })
}
