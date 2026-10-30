import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { QuoteDto } from '@/shared/api/contracts'

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
    queryFn: ({ signal }) =>
      apiClient.get<QuoteDto>(`/securities/${encodeURIComponent(securityId)}/quote`, { signal }),
    refetchInterval: 30_000,
  })
}
