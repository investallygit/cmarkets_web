import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SavedScreenDto, ScreenerRequestDto } from '@/shared/api/contracts'
import { analysisApi } from '@/shared/api/endpoints'

export const screenerKeys = {
  all: ['screener'] as const,
  results: (request: ScreenerRequestDto) => [...screenerKeys.all, 'results', request] as const,
  screens: () => [...screenerKeys.all, 'screens'] as const,
}

/**
 * POST /analysis/screener. Running a screen reads data, so it is cached as a query by its
 * criteria; the previous results stay on screen while the next ones load.
 */
export function useScreener(request: ScreenerRequestDto) {
  return useQuery({
    queryKey: screenerKeys.results(request),
    queryFn: ({ signal }) => analysisApi.screener(request, signal),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /analysis/screens: the user's saved screens. */
export function useSavedScreens() {
  return useQuery({
    queryKey: screenerKeys.screens(),
    queryFn: ({ signal }) => analysisApi.screens(signal),
    staleTime: 5 * 60_000,
  })
}

/**
 * Writes what the server returned into the cached list, then refetches it. A list not loaded yet
 * is left to its fetch, which will include the change.
 */
function useUpdateScreens() {
  const queryClient = useQueryClient()
  return (update: (screens: SavedScreenDto[]) => SavedScreenDto[]) => {
    if (queryClient.getQueryData(screenerKeys.screens())) {
      queryClient.setQueryData<SavedScreenDto[]>(
        screenerKeys.screens(),
        (screens) => screens && update(screens),
      )
    }
    void queryClient.invalidateQueries({ queryKey: screenerKeys.screens() })
  }
}

export function useSaveScreen() {
  const updateScreens = useUpdateScreens()
  return useMutation({
    mutationFn: analysisApi.saveScreen,
    onSuccess: (saved) => updateScreens((screens) => [...screens, saved]),
  })
}

export function useDeleteScreen() {
  const updateScreens = useUpdateScreens()
  return useMutation({
    mutationFn: analysisApi.deleteScreen,
    onSuccess: (_result, id) =>
      updateScreens((screens) => screens.filter((screen) => screen.id !== id)),
  })
}
