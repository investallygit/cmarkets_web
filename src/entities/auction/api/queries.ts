import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PublicOfferStatus } from '@/shared/api/contracts'
import {
  bondsApi,
  type AuctionQuery,
  type AuctionRatesQuery,
  type AuctionSummaryQuery,
} from '@/shared/api/endpoints'

export type { AuctionQuery, AuctionRatesQuery, AuctionSummaryQuery }

const STALE = 5 * 60_000

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (query: AuctionQuery) => [...auctionKeys.all, query] as const,
  planned: (query: AuctionQuery) => [...auctionKeys.all, 'planned', query] as const,
  summary: (query: AuctionSummaryQuery) => [...auctionKeys.all, 'summary', query] as const,
  rates: (query: AuctionRatesQuery) => [...auctionKeys.all, 'rates', query] as const,
  detail: (id: string) => [...auctionKeys.all, 'detail', id] as const,
  publicOffers: (status?: PublicOfferStatus) =>
    [...auctionKeys.all, 'public-offers', status ?? 'all'] as const,
}

/** GET /auctions: BEAC auction results, newest first. */
export function useAuctions(query: AuctionQuery = {}) {
  return useQuery({
    queryKey: auctionKeys.list(query),
    queryFn: ({ signal }) => bondsApi.auctions(query, signal),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })
}

/** GET /auctions?status=planned: AUC NEXT's coming auctions, soonest first (screen 33). */
export function usePlannedAuctions(query: AuctionQuery = {}) {
  return useQuery({
    queryKey: auctionKeys.planned(query),
    queryFn: ({ signal }) => bondsApi.plannedAuctions(query, signal),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })
}

/** GET /auctions/summary: AUC's indicators of a year. */
export function useAuctionSummary(query: AuctionSummaryQuery) {
  return useQuery({
    queryKey: auctionKeys.summary(query),
    queryFn: ({ signal }) => bondsApi.auctionSummary(query, signal),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })
}

/** GET /auctions/rates: a tenor's monthly average rate by state over 24 months. */
export function useAuctionRates(query: AuctionRatesQuery) {
  return useQuery({
    queryKey: auctionKeys.rates(query),
    queryFn: ({ signal }) => bondsApi.auctionRates(query, signal),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })
}

/** GET /auctions/{id}: a result and its bids by rate; nothing until one is picked. */
export function useAuctionDetail(id: string | null) {
  return useQuery({
    queryKey: auctionKeys.detail(id ?? ''),
    queryFn: ({ signal }) => bondsApi.auction(id!, signal),
    enabled: id !== null,
    staleTime: STALE,
  })
}

/** GET /public-offers: APE's public bond issues. */
export function usePublicOffers(status?: PublicOfferStatus) {
  return useQuery({
    queryKey: auctionKeys.publicOffers(status),
    queryFn: ({ signal }) => bondsApi.publicOffers(status, signal),
    staleTime: STALE,
  })
}
