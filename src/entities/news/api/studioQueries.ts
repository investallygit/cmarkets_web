import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  NewsImportRowFixDto,
  NewsImportRowStatus,
  NewsPublishDto,
  NewsType,
  ProviderNewsDto,
  ProviderNewsWriteDto,
  ProviderSourceWriteDto,
} from '@/shared/api/contracts'
import { providerApi, type ProviderNewsQuery } from '@/shared/api/endpoints'
import { newsKeys } from './queries'

/**
 * The studio's queries (screen 13) sit under the feed's keys: a scheduled item going live
 * (NewsPublished) refreshes them too.
 */
export const studioKeys = {
  all: [...newsKeys.all, 'studio'] as const,
  list: (query: ProviderNewsQuery) => [...studioKeys.all, 'list', query] as const,
  item: (id: string) => [...studioKeys.all, 'item', id] as const,
  stats: () => [...studioKeys.all, 'stats'] as const,
  earnings: (month: string | null) => [...studioKeys.all, 'earnings', month] as const,
  source: () => [...studioKeys.all, 'source'] as const,
  imports: () => [...studioKeys.all, 'imports'] as const,
  import: (id: string) => [...studioKeys.all, 'import', id] as const,
  importRows: (id: string, status: NewsImportRowStatus | null) =>
    [...studioKeys.all, 'import', id, 'rows', status] as const,
}

/** GET /provider/news: My news, by status and type, newest first. */
export function useMyNews(query: ProviderNewsQuery) {
  return useQuery({
    queryKey: studioKeys.list(query),
    queryFn: ({ signal }) => providerApi.myNews(query, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /provider/news/{id}: the item in the editor. */
export function useProviderNews(id: string | null) {
  return useQuery({
    queryKey: studioKeys.item(id ?? ''),
    queryFn: ({ signal }) => providerApi.news(id ?? '', signal),
    enabled: Boolean(id),
    // The editor holds the fields: a refetch must not bring back what it saved meanwhile.
    staleTime: Infinity,
  })
}

/** GET /provider/news/stats?groupBy=item: the unique clicks of each item, payable and excluded. */
export function useNewsClicks() {
  return useQuery({
    queryKey: studioKeys.stats(),
    queryFn: ({ signal }) => providerApi.stats('item', signal),
    refetchInterval: 60_000,
  })
}

/** GET /provider/earnings: the current month's estimate, which the newspaper follows live. */
export function useNewsEarnings(month: string | null = null) {
  return useQuery({
    queryKey: studioKeys.earnings(month),
    queryFn: ({ signal }) => providerApi.earnings(month, signal),
    refetchInterval: 60_000,
  })
}

/** GET /provider/source: the newspaper (the studio's title, its tag) and today's FLASH items. */
export function useProviderSource({ enabled = true } = {}) {
  return useQuery({
    queryKey: studioKeys.source(),
    queryFn: ({ signal }) => providerApi.source(signal),
    staleTime: 60_000,
    enabled,
  })
}

/** GET /provider/news/imports: the last upload first. */
export function useLastNewsImport() {
  return useQuery({
    queryKey: studioKeys.imports(),
    queryFn: ({ signal }) => providerApi.imports({ page: 1, pageSize: 1 }, signal),
    select: (page) => page.items.at(0) ?? null,
  })
}

/** GET /provider/news/imports/{id}: asked again every second while its job checks it. */
export function useNewsImport(id: string | null) {
  return useQuery({
    queryKey: studioKeys.import(id ?? ''),
    queryFn: ({ signal }) => providerApi.import(id ?? '', signal),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'checking' ? 1_000 : false),
  })
}

/** GET /provider/news/imports/{id}/rows?status=: the rows by line. */
export function useNewsImportRows(id: string | null, status: NewsImportRowStatus | null) {
  return useQuery({
    queryKey: studioKeys.importRows(id ?? '', status),
    queryFn: ({ signal }) =>
      providerApi.importRows(id ?? '', { status, page: 1, pageSize: 500 }, signal),
    enabled: Boolean(id),
  })
}

/** The item as the server answered it: the editor's copy, and the list's row. */
function useKeepItem() {
  const queryClient = useQueryClient()
  return (item: ProviderNewsDto) => {
    queryClient.setQueryData(studioKeys.item(item.id), item)
    void queryClient.invalidateQueries({ queryKey: [...studioKeys.all, 'list'] })
  }
}

/** POST /provider/news: a draft of the type chosen. */
export function useCreateProviderNews() {
  const keep = useKeepItem()
  return useMutation({
    mutationFn: (type: NewsType) => providerApi.createNews(type),
    onSuccess: keep,
  })
}

/** PUT /provider/news/{id}: the editor's save, with the version it read. */
export function useSaveProviderNews() {
  const keep = useKeepItem()
  return useMutation({
    mutationFn: ({ id, news }: { id: string; news: ProviderNewsWriteDto }) =>
      providerApi.saveNews(id, news),
    onSuccess: keep,
  })
}

/** POST /provider/news/{id}/publish: live now, or scheduled; the feed and the quota follow. */
export function usePublishProviderNews() {
  const keep = useKeepItem()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, publication }: { id: string; publication: NewsPublishDto }) =>
      providerApi.publishNews(id, publication),
    onSuccess: (item) => {
      keep(item)
      void queryClient.invalidateQueries({ queryKey: studioKeys.source() })
      void queryClient.invalidateQueries({ queryKey: [...newsKeys.all, 'list'] })
    },
  })
}

/** POST /provider/news/{id}/withdraw: out of the feed, with its reason. */
export function useWithdrawProviderNews() {
  const keep = useKeepItem()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      providerApi.withdrawNews(id, reason),
    onSuccess: (item) => {
      keep(item)
      void queryClient.invalidateQueries({ queryKey: studioKeys.source() })
      void queryClient.invalidateQueries({ queryKey: [...newsKeys.all, 'list'] })
    },
  })
}

/** POST /provider/news/{id}/attachments: an image of the body with its credit, or the PDF. */
export function useUploadNewsFile(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, credit }: { file: File; credit: string | null }) =>
      providerApi.uploadFile(id, file, credit),
    onSuccess: (file) => {
      // The PDF is the item's: its copy shows it, with the version it moved to.
      if (file.kind === 'document')
        void queryClient.invalidateQueries({ queryKey: studioKeys.item(id) })
    },
  })
}

/** DELETE /provider/news/{id}/attachments/{fileId}: the PDF taken off. */
export function useRemoveNewsFile(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => providerApi.removeFile(id, fileId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: studioKeys.item(id) }),
  })
}

/** PUT /provider/source: the newspaper's name, tag, site and language. */
export function useUpdateProviderSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (source: ProviderSourceWriteDto) => providerApi.updateSource(source),
    onSuccess: (source) => {
      queryClient.setQueryData(studioKeys.source(), source)
      void queryClient.invalidateQueries({ queryKey: newsKeys.all })
    },
  })
}

/** GET /provider/news/template?format=: the file import's template. */
export function useNewsTemplate() {
  return useMutation({ mutationFn: (format: 'csv' | 'xlsx') => providerApi.template(format) })
}

/** POST /provider/news/imports: a CSV, XLSX or ZIP file, whose job checks it. */
export function useUploadNewsImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => providerApi.upload(file),
    onSuccess: (upload) => {
      queryClient.setQueryData(studioKeys.import(upload.id), upload)
      void queryClient.invalidateQueries({ queryKey: studioKeys.imports() })
    },
  })
}

/** PATCH /provider/news/imports/{id}/rows/{rowId}: a row fixed, the rows checked again. */
export function useFixNewsImportRow(importId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rowId, fix }: { rowId: number; fix: NewsImportRowFixDto }) =>
      providerApi.fixRow(importId, rowId, fix),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studioKeys.import(importId) })
      void queryClient.invalidateQueries({ queryKey: studioKeys.imports() })
    },
  })
}

/** POST /provider/news/imports/{id}/publish: the valid rows published or scheduled. */
export function usePublishNewsImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (importId: string) => providerApi.publishImport(importId),
    onSuccess: (upload) => {
      queryClient.setQueryData(studioKeys.import(upload.id), upload)
      void queryClient.invalidateQueries({ queryKey: newsKeys.all })
    },
  })
}
