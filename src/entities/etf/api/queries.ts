import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EtfPeriod, EtfScreenerQuery, SavedEtfScreenDto } from '@/shared/api/contracts'
import { analysisApi, etfsApi } from '@/shared/api/endpoints'

/** ETFS (screen 15) and an ETF's reads: one root, so that a publication refreshes them all. */
export const etfKeys = {
  all: ['etfs'] as const,
  screener: (query: EtfScreenerQuery) => [...etfKeys.all, 'screener', query] as const,
  facets: () => [...etfKeys.all, 'facets'] as const,
  etf: (id: string) => [...etfKeys.all, 'etf', id] as const,
  performance: (id: string, periods: readonly EtfPeriod[] | null) =>
    [...etfKeys.all, 'performance', id, periods?.join(',') ?? 'all'] as const,
  distributions: (id: string) => [...etfKeys.all, 'distributions', id] as const,
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
