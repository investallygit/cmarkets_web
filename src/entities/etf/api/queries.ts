import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  EtfAllocationBy,
  EtfPeriod,
  EtfScreenerQuery,
  SavedEtfScreenDto,
} from '@/shared/api/contracts'
import { analysisApi, etfsApi, type EtfHistoryQuery } from '@/shared/api/endpoints'

/** ETFS (screen 15) and an ETF's reads: one root, so that a publication refreshes them all. */
export const etfKeys = {
  all: ['etfs'] as const,
  screener: (query: EtfScreenerQuery) => [...etfKeys.all, 'screener', query] as const,
  facets: () => [...etfKeys.all, 'facets'] as const,
  etf: (id: string) => [...etfKeys.all, 'etf', id] as const,
  performance: (id: string, periods: readonly EtfPeriod[] | null) =>
    [...etfKeys.all, 'performance', id, periods?.join(',') ?? 'all'] as const,
  distributions: (id: string) => [...etfKeys.all, 'distributions', id] as const,
  history: (id: string, query: EtfHistoryQuery) => [...etfKeys.all, 'history', id, query] as const,
  holdings: (id: string, top: number | null) =>
    [...etfKeys.all, 'holdings', id, top ?? 'all'] as const,
  allocation: (id: string, by: EtfAllocationBy) => [...etfKeys.all, 'allocation', id, by] as const,
  annualReturns: (id: string) => [...etfKeys.all, 'annual-returns', id] as const,
  screens: () => ['etf-screens'] as const,
}

/** GET /etfs: the ETFs of the latest calculation that meet the criteria; the previous results stay while the next load. */
export function useEtfScreener(query: EtfScreenerQuery) {
  return useQuery({
    queryKey: etfKeys.screener(query),
    queryFn: ({ signal }) => etfsApi.screener(query, signal),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /etfs/facets: the values each filter offers, with their counts. */
export function useEtfFacets() {
  return useQuery({
    queryKey: etfKeys.facets(),
    queryFn: ({ signal }) => etfsApi.facets(signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /etfs/{id}: blocks A to D; nothing while none is selected. */
export function useEtf(id: string | null) {
  return useQuery({
    queryKey: etfKeys.etf(id ?? ''),
    queryFn: ({ signal }) => etfsApi.etf(id ?? '', signal),
    enabled: id !== null,
    staleTime: 60_000,
  })
}

/** GET /etfs/{id}/performance: block E over the periods asked, every period without them. */
export function useEtfPerformance(id: string | null, periods: readonly EtfPeriod[] | null = null) {
  return useQuery({
    queryKey: etfKeys.performance(id ?? '', periods),
    queryFn: ({ signal }) => etfsApi.performance(id ?? '', periods, signal),
    enabled: id !== null,
    staleTime: 60_000,
  })
}

/** GET /etfs/{id}/distributions: what the fund paid, the latest first. */
export function useEtfDistributions(id: string | null) {
  return useQuery({
    queryKey: etfKeys.distributions(id ?? ''),
    queryFn: ({ signal }) => etfsApi.distributions(id ?? '', signal),
    enabled: id !== null,
    staleTime: 5 * 60_000,
  })
}

/**
 * GET /etfs/{id}/history (screen 19): the sessions of the period with what the chart draws; the
 * previous period stays while the next one loads; nothing until the period is known.
 */
export function useEtfHistory(id: string, query: EtfHistoryQuery | null) {
  return useQuery({
    queryKey: etfKeys.history(id, query ?? {}),
    queryFn: ({ signal }) => etfsApi.history(id, query ?? {}, signal),
    enabled: query !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /etfs/{id}/holdings?top=: the largest lines (every line known with null) and their number. */
export function useEtfHoldings(id: string, top: number | null) {
  return useQuery({
    queryKey: etfKeys.holdings(id, top),
    queryFn: ({ signal }) => etfsApi.holdings(id, top, signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /etfs/{id}/allocation?by=: the weights by sector or region; the other view stays while it loads. */
export function useEtfAllocation(id: string, by: EtfAllocationBy) {
  return useQuery({
    queryKey: etfKeys.allocation(id, by),
    queryFn: ({ signal }) => etfsApi.allocation(id, by, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /etfs/{id}/annual-returns: the calendar years, the latest first. */
export function useEtfAnnualReturns(id: string) {
  return useQuery({
    queryKey: etfKeys.annualReturns(id),
    queryFn: ({ signal }) => etfsApi.annualReturns(id, signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /analysis/etf-screens: the user's saved ETF screens. */
export function useSavedEtfScreens(enabled = true) {
  return useQuery({
    queryKey: etfKeys.screens(),
    queryFn: ({ signal }) => analysisApi.etfScreens(signal),
    staleTime: 5 * 60_000,
    enabled,
  })
}

/** Writes what the server returned into the cached list, then refetches it. */
function useUpdateEtfScreens() {
  const queryClient = useQueryClient()
  return (update: (screens: SavedEtfScreenDto[]) => SavedEtfScreenDto[]) => {
    if (queryClient.getQueryData(etfKeys.screens())) {
      queryClient.setQueryData<SavedEtfScreenDto[]>(
        etfKeys.screens(),
        (screens) => screens && update(screens),
      )
    }
    void queryClient.invalidateQueries({ queryKey: etfKeys.screens() })
  }
}

export function useSaveEtfScreen() {
  const updateScreens = useUpdateEtfScreens()
  return useMutation({
    mutationFn: analysisApi.saveEtfScreen,
    onSuccess: (saved) => updateScreens((screens) => [...screens, saved]),
  })
}

export function useDeleteEtfScreen() {
  const updateScreens = useUpdateEtfScreens()
  return useMutation({
    mutationFn: analysisApi.deleteEtfScreen,
    onSuccess: (_result, id) =>
      updateScreens((screens) => screens.filter((screen) => screen.id !== id)),
  })
}
