import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewsTopic, NewsWriteDto } from '@/shared/api/contracts'
import { contentApi, dataAdminApi } from '@/shared/api/endpoints'

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
    queryFn: ({ signal }) => contentApi.news(filters, { page: 1, pageSize }, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /news/{id}: the full article. */
export function useNewsArticle(id: string | null) {
  return useQuery({
    queryKey: newsKeys.article(id ?? ''),
    queryFn: ({ signal }) => contentApi.article(id ?? '', signal),
    staleTime: 5 * 60_000,
    enabled: Boolean(id),
  })
}

/** POST /data/news, or PUT /data/news/{id} for an edit: news entered by the Data admin. */
export function useSaveNews() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, news }: { id: string | null; news: NewsWriteDto }) =>
      dataAdminApi.saveNews(id, news),
    onSuccess: (article) => {
      queryClient.setQueryData(newsKeys.article(article.id), article)
      void queryClient.invalidateQueries({ queryKey: newsKeys.all })
    },
  })
}
