import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BondScreenerQuery, SavedBondScreenDto } from '@/shared/api/contracts'
import { analysisApi, bondsApi } from '@/shared/api/endpoints'

/** BS, the bond screener (screen 17): one root, so that a publication refreshes it all. */
export const bondScreenerKeys = {
  all: ['bond-screener'] as const,
  results: (query: BondScreenerQuery) => [...bondScreenerKeys.all, 'results', query] as const,
  facets: () => [...bondScreenerKeys.all, 'facets'] as const,
  analytics: (id: string) => [...bondScreenerKeys.all, 'analytics', id] as const,
  screens: () => ['bond-screens'] as const,
}

/**
 * GET /bonds/screener: the bonds of the latest daily calculation that meet the criteria. The
 * previous results stay on screen while the next ones load.
 */
export function useBondScreener(query: BondScreenerQuery) {
  return useQuery({
    queryKey: bondScreenerKeys.results(query),
    queryFn: ({ signal }) => bondsApi.screener(query, signal),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /bonds/screener/facets: the countries and currencies the filters offer. */
export function useBondScreenerFacets() {
  return useQuery({
    queryKey: bondScreenerKeys.facets(),
    queryFn: ({ signal }) => bondsApi.screenerFacets(signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /bonds/{id}/analytics: the selected bond's four blocks; nothing while none is selected. */
export function useBondAnalytics(id: string | null) {
  return useQuery({
    queryKey: bondScreenerKeys.analytics(id ?? ''),
    queryFn: ({ signal }) => bondsApi.analytics(id ?? '', signal),
    enabled: id !== null,
    staleTime: 60_000,
  })
}

/** GET /analysis/bond-screens: the user's saved bond screens. */
export function useSavedBondScreens(enabled = true) {
  return useQuery({
    queryKey: bondScreenerKeys.screens(),
    queryFn: ({ signal }) => analysisApi.bondScreens(signal),
    staleTime: 5 * 60_000,
    enabled,
  })
}

/** Writes what the server returned into the cached list, then refetches it. */
function useUpdateBondScreens() {
  const queryClient = useQueryClient()
  return (update: (screens: SavedBondScreenDto[]) => SavedBondScreenDto[]) => {
    if (queryClient.getQueryData(bondScreenerKeys.screens())) {
      queryClient.setQueryData<SavedBondScreenDto[]>(
        bondScreenerKeys.screens(),
        (screens) => screens && update(screens),
      )
    }
    void queryClient.invalidateQueries({ queryKey: bondScreenerKeys.screens() })
  }
}

export function useSaveBondScreen() {
  const updateScreens = useUpdateBondScreens()
  return useMutation({
    mutationFn: analysisApi.saveBondScreen,
    onSuccess: (saved) => updateScreens((screens) => [...screens, saved]),
  })
}

export function useDeleteBondScreen() {
  const updateScreens = useUpdateBondScreens()
  return useMutation({
    mutationFn: analysisApi.deleteBondScreen,
    onSuccess: (_result, id) =>
      updateScreens((screens) => screens.filter((screen) => screen.id !== id)),
  })
}
