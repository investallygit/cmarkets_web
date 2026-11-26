import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/shared/api/endpoints'

const STALE = 10 * 60_000

export const beacKeys = {
  all: ['beac'] as const,
  summary: () => [...beacKeys.all, 'summary'] as const,
  rateHistory: (from: string) => [...beacKeys.all, 'rates', from] as const,
  decisions: () => [...beacKeys.all, 'decisions'] as const,
  operations: () => [...beacKeys.all, 'operations'] as const,
  interbank: () => [...beacKeys.all, 'interbank'] as const,
  aggregates: () => [...beacKeys.all, 'aggregates'] as const,
}

/** GET /beac/summary: BEAC's indicators (screen 34, sixth version). */
export function useBeacSummary() {
  return useQuery({
    queryKey: beacKeys.summary(),
    queryFn: ({ signal }) => marketApi.beacSummary(signal),
    staleTime: STALE,
  })
}

/** GET /beac/rates/history?from=: the corridor's steps since a day. */
export function useBeacRateHistory(from: string) {
  return useQuery({
    queryKey: beacKeys.rateHistory(from),
    queryFn: ({ signal }) => marketApi.beacRateHistory(from, signal),
    staleTime: STALE,
  })
}

/** GET /beac/decisions: the Monetary Policy Committee's meetings, the announced first. */
export function useBeacDecisions() {
  return useQuery({
    queryKey: beacKeys.decisions(),
    queryFn: ({ signal }) => marketApi.beacDecisions(signal),
    staleTime: STALE,
  })
}

/** GET /beac/operations: the latest tenders on the banks' liquidity. */
export function useBeacOperations() {
  return useQuery({
    queryKey: beacKeys.operations(),
    queryFn: ({ signal }) => marketApi.beacOperations(signal),
    staleTime: STALE,
  })
}

/** GET /beac/interbank: the interbank market's latest week. */
export function useBeacInterbank() {
  return useQuery({
    queryKey: beacKeys.interbank(),
    queryFn: ({ signal }) => marketApi.beacInterbank(signal),
    staleTime: STALE,
  })
}

/** GET /beac/aggregates: the monetary aggregates' latest figures. */
export function useBeacAggregates() {
  return useQuery({
    queryKey: beacKeys.aggregates(),
    queryFn: ({ signal }) => marketApi.beacAggregates(signal),
    staleTime: STALE,
  })
}
