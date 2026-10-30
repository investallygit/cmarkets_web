import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { NewsArticleDto, NewsItemDto, NewsTopic, Paged } from '@/shared/api/contracts'

export interface NewsQuery {
  topic?: NewsTopic
  securityId?: string
  country?: string
  pageSize?: number
}

export const newsKeys = {
  all: ['news'] as const,
  list: (query: NewsQuery) => [...newsKeys.all, 'list', query] as const,
  article: (id: string) => [...newsKeys.all, 'article', id] as const,
}

/** GET /news: the feed, newest first, filtered by topic, security or country. */
export function useNews({ pageSize = 20, ...filters }: NewsQuery = {}) {
  return useQuery({
    queryKey: newsKeys.list({ pageSize, ...filters }),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<NewsItemDto>>('/news', {
        query: { ...filters, page: 1, pageSize },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}

/** GET /news/{id}: the full article. */
export function useNewsArticle(id: string | null) {
  return useQuery({
    queryKey: newsKeys.article(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<NewsArticleDto>(`/news/${encodeURIComponent(id ?? '')}`, { signal }),
    staleTime: 5 * 60_000,
    enabled: Boolean(id),
  })
}
