import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { NewsItemDto, Paged } from '@/shared/api/contracts'

export type NewsFilter = 'all' | 'issuer' | 'regulator'

export const newsKeys = {
  all: ['news'] as const,
  list: (filter: NewsFilter) => [...newsKeys.all, filter] as const,
}

export function useNews(filter: NewsFilter) {
  return useQuery({
    queryKey: newsKeys.list(filter),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<NewsItemDto>>('/news', {
        query: { topic: filter === 'all' ? undefined : filter, page: 1, pageSize: 20 },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}
