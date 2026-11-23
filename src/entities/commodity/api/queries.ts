import { keepPreviousData, queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { CommodityFrequency, CommodityListItemDto } from '@/shared/api/contracts'
import { marketApi } from '@/shared/api/endpoints'
import { DEFAULT_COMMODITY_PERIOD, periodStart } from '../lib/commodityValues'

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

const profileOptions = (code: string) =>
  queryOptions({
    queryKey: commodityKeys.profile(code),
    queryFn: ({ signal }) => marketApi.commodity(code, signal),
    staleTime: COMMODITY_STALE_TIME,
  })

const historyOptions = (code: string, interval: CommodityFrequency, from: string | null) =>
  queryOptions({
    queryKey: commodityKeys.history(code, interval, from),
    queryFn: ({ signal }) =>
      marketApi.commodityHistory(code, { interval, from: from ?? undefined }, signal),
    staleTime: COMMODITY_STALE_TIME,
  })

const relatedOptions = (code: string) =>
  queryOptions({
    queryKey: commodityKeys.related(code),
    queryFn: ({ signal }) => marketApi.commodityRelated(code, signal),
    staleTime: COMMODITY_STALE_TIME,
  })

/** Screen 21's list: every series, in its order, with its latest value. */
export function useCommodities({ enabled = true } = {}) {
  return useQuery({
    queryKey: commodityKeys.list(),
    queryFn: ({ signal }) => marketApi.commodities(undefined, signal),
    enabled,
    staleTime: COMMODITY_STALE_TIME,
  })
}

/** The list's line of a series, at once where the list is loaded; undefined before it is. */
export function useCommodityItem(code: string): CommodityListItemDto | undefined {
  return useCommodities().data?.find((item) => item.code === code)
}

/** Loads what DES shows of a series the user is about to open, the chart's first view included. */
export function usePrefetchCommodity() {
  const queryClient = useQueryClient()
  return useCallback(
    ({ code, frequency }: CommodityListItemDto, today: string) => {
      const from = periodStart(DEFAULT_COMMODITY_PERIOD, today)
      void queryClient.prefetchQuery(profileOptions(code))
      void queryClient.prefetchQuery(historyOptions(code, frequency, from))
      void queryClient.prefetchQuery(relatedOptions(code))
    },
    [queryClient],
  )
}

/** A commodity's profile: the header's, the statistics', the description's and the data's. */
export function useCommodity(code: string) {
  return useQuery(profileOptions(code))
}

/**
 * A series' values at an interval it offers from a day on (its whole history without one), each
 * with its 50-value average; the series' own stay while another period of it loads.
 */
export function useCommodityHistory(
  code: string,
  interval: CommodityFrequency,
  from: string | null,
  enabled = true,
) {
  return useQuery({
    ...historyOptions(code, interval, from),
    enabled,
    // Never another series' values under this one's name.
    placeholderData: (previous) => (previous?.code === code ? previous : undefined),
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
  return useQuery(relatedOptions(code))
}
