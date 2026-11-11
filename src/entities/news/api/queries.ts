import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewsReportWriteDto, NewsWriteDto } from '@/shared/api/contracts'
import { contentApi, dataAdminApi, type NewsFilters } from '@/shared/api/endpoints'

export interface NewsQuery extends NewsFilters {
  pageSize?: number
}

export const newsKeys = {
  all: ['news'] as const,
  list: (query: NewsQuery) => [...newsKeys.all, 'list', query] as const,
  sources: () => [...newsKeys.all, 'sources'] as const,
  article: (id: string) => [...newsKeys.all, 'article', id] as const,
}

/** GET /news: the feed, newest first, by type, channel, newspaper, security, country, category. */
export function useNews({ pageSize = 20, ...filters }: NewsQuery = {}) {
  return useQuery({
    queryKey: newsKeys.list({ pageSize, ...filters }),
    queryFn: ({ signal }) => contentApi.news(filters, { page: 1, pageSize }, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /news/sources: the newspapers that published, for the N screen's filter. */
export function useNewsSources() {
  return useQuery({
    queryKey: newsKeys.sources(),
    queryFn: ({ signal }) => contentApi.newsSources(signal),
    staleTime: 10 * 60_000,
  })
}

/** GET /news/{id}: the content, whose display counts the unique click (useNewsView). */
export function useNewsArticle(id: string | null) {
  return useQuery({
    queryKey: newsKeys.article(id ?? ''),
    queryFn: ({ signal }) => contentApi.article(id ?? '', signal),
    staleTime: 5 * 60_000,
    enabled: Boolean(id),
  })
}

/** POST /news/{id}/report: a reader reports the item to the moderators (NEWS, MOD). */
export function useReportNews(id: string) {
  return useMutation({
    mutationFn: (report: NewsReportWriteDto) => contentApi.reportNews(id, report),
  })
}

/** POST /data/news, or PUT /data/news/{id} for an edit: an item of the CMARKET channel. */
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
