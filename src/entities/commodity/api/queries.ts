import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { CommodityFrequency } from '@/shared/api/contracts'
import { marketApi } from '@/shared/api/endpoints'

/** EODHD's commodities change twice a day at most (spec section 9): half an hour is fresh enough. */
const COMMODITY_STALE_TIME = 30 * 60_000

export const commodityKeys = {
  all: ['commodities'] as const,
  list: () => ['commodities', 'list'] as const,
  profile: (code: string) => ['commodities', 'profile', code] as const,
  history: (code: string, interval: CommodityFrequency, from: string | null) =>
    ['commodities', 'history', code, interval, from ?? 'max'] as const,
  comparison: (codes: readonly string[], from: string | null) =>
    ['commodities', 'compare', codes.join(','), from ?? 'max'] as const,
  related: (code: string) => ['commodities', 'related', code] as const,
}

/** Screen 21's list: every series, in its order, with its latest value. */
export function useCommodities() {
  return useQuery({
    queryKey: commodityKeys.list(),
    queryFn: ({ signal }) => marketApi.commodities(undefined, signal),
    staleTime: COMMODITY_STALE_TIME,
  })
}

/** A commodity's profile: the header's, the statistics', the description's and the data's. */
export function useCommodity(code: string) {
  return useQuery({
    queryKey: commodityKeys.profile(code),
    queryFn: ({ signal }) => marketApi.commodity(code, signal),
    staleTime: COMMODITY_STALE_TIME,
  })
}

/**
 * A series' values at an interval it offers from a day on (its whole history without one), each
 * with its 50-value average; the previous period's stay while the next loads.
 */
export function useCommodityHistory(
  code: string,
  interval: CommodityFrequency,
  from: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: commodityKeys.history(code, interval, from),
    queryFn: ({ signal }) =>
      marketApi.commodityHistory(code, { interval, from: from ?? undefined }, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: COMMODITY_STALE_TIME,
  })
}

/**
 * Up to five series rebased to 100 on their monthly values from a month on (their whole history
 * without one), and their correlations over those months.
 */
export function useCommodityComparison(codes: readonly string[], from: string | null) {
  return useQuery({
    queryKey: commodityKeys.comparison(codes, from),
    queryFn: ({ signal }) => marketApi.commodityCompare({ codes, from: from ?? undefined }, signal),
    enabled: codes.length > 0,
    placeholderData: keepPreviousData,
    staleTime: COMMODITY_STALE_TIME,
  })
}

/** The profile's CEMAC links: the countries exposed, the related securities, the latest news. */
export function useCommodityRelated(code: string) {
  return useQuery({
    queryKey: commodityKeys.related(code),
    queryFn: ({ signal }) => marketApi.commodityRelated(code, signal),
    staleTime: COMMODITY_STALE_TIME,
  })
}
