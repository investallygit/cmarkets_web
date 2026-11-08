import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { bondsApi, type AuctionQuery } from '@/shared/api/endpoints'

export type { AuctionQuery }

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (query: AuctionQuery) => [...auctionKeys.all, query] as const,
}

/** GET /auctions: BEAC auction results, newest first. */
export function useAuctions(query: AuctionQuery = {}) {
  return useQuery({
    queryKey: auctionKeys.list(query),
    queryFn: ({ signal }) => bondsApi.auctions(query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}
