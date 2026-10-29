import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { WatchlistDto } from '@/shared/api/contracts'

export const watchlistKeys = { all: ['watchlists'] as const }

export function useWatchlists() {
  return useQuery({
    queryKey: watchlistKeys.all,
    queryFn: ({ signal }) => apiClient.get<WatchlistDto[]>('/watchlists', { signal }),
  })
}
