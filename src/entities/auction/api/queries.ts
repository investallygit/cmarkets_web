import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { AuctionDto, AuctionInstrument } from '@/shared/api/contracts'

export interface AuctionQuery {
  country?: string
  instrument?: AuctionInstrument
}

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (query: AuctionQuery) => [...auctionKeys.all, query] as const,
}

/** GET /auctions: BEAC auction results, newest first. */
export function useAuctions(query: AuctionQuery = {}) {
  return useQuery({
    queryKey: auctionKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<AuctionDto[]>('/auctions', { query: { ...query }, signal }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}
