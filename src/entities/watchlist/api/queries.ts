import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { WatchlistDto, WatchlistInputDto, WatchlistItemDto } from '@/shared/api/contracts'

export const watchlistKeys = { all: ['watchlists'] as const }

const listPath = (id: string) => `/watchlists/${encodeURIComponent(id)}`
const itemPath = (id: string, securityId: string) =>
  `${listPath(id)}/items/${encodeURIComponent(securityId)}`

/** GET /watchlists: the user's lists with the quote of each security. */
export function useWatchlists() {
  return useQuery({
    queryKey: watchlistKeys.all,
    queryFn: ({ signal }) => apiClient.get<WatchlistDto[]>('/watchlists', { signal }),
  })
}

/**
 * Writes what the server returned into the cached lists, so the panels update at once, then
 * refetches them. Lists not loaded yet are left to their fetch, which will include the change.
 */
function useUpdateLists() {
  const queryClient = useQueryClient()
  return (update: (lists: WatchlistDto[]) => WatchlistDto[]) => {
    if (queryClient.getQueryData(watchlistKeys.all)) {
      queryClient.setQueryData<WatchlistDto[]>(watchlistKeys.all, (lists) => lists && update(lists))
    }
    void queryClient.invalidateQueries({ queryKey: watchlistKeys.all })
  }
}

export function useCreateWatchlist() {
  const updateLists = useUpdateLists()
  return useMutation({
    mutationFn: (input: WatchlistInputDto) => apiClient.post<WatchlistDto>('/watchlists', input),
    onSuccess: (created) => updateLists((lists) => [...lists, created]),
  })
}

/** Renames a list or changes its columns. */
export function useUpdateWatchlist() {
  const updateLists = useUpdateLists()
  return useMutation({
    mutationFn: ({ id, ...input }: WatchlistInputDto & { id: string }) =>
      apiClient.put<WatchlistDto>(listPath(id), input),
    onSuccess: (updated) =>
      updateLists((lists) => lists.map((list) => (list.id === updated.id ? updated : list))),
  })
}

export function useDeleteWatchlist() {
  const updateLists = useUpdateLists()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(listPath(id)),
    onSuccess: (_result, id) => updateLists((lists) => lists.filter((list) => list.id !== id)),
  })
}

interface ItemChange {
  watchlistId: string
  securityId: string
}

export function useAddToWatchlist() {
  const updateLists = useUpdateLists()
  return useMutation({
    mutationFn: ({ watchlistId, securityId }: ItemChange) =>
      apiClient.post<WatchlistItemDto>(itemPath(watchlistId, securityId)),
    onSuccess: (item, { watchlistId }) =>
      updateLists((lists) =>
        lists.map((list) =>
          list.id !== watchlistId || list.items.some((it) => it.securityId === item.securityId)
            ? list
            : { ...list, items: [...list.items, item] },
        ),
      ),
  })
}

export function useRemoveFromWatchlist() {
  const updateLists = useUpdateLists()
  return useMutation({
    mutationFn: ({ watchlistId, securityId }: ItemChange) =>
      apiClient.delete<void>(itemPath(watchlistId, securityId)),
    onSuccess: (_result, { watchlistId, securityId }) =>
      updateLists((lists) =>
        lists.map((list) =>
          list.id === watchlistId
            ? { ...list, items: list.items.filter((item) => item.securityId !== securityId) }
            : list,
        ),
      ),
  })
}
