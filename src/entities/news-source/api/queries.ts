import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import type {
  AdminNewsSourceDetailsDto,
  AdminNewsSourceWriteDto,
  IngestClientWriteDto,
  NewsChannel,
  NewsSettingsWriteDto,
  PublisherWriteDto,
} from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'

/** Under the Admin's root: an action of SRC or NEWS refreshes every list the back-office shows. */
export const newsSourceKeys = {
  all: [...ADMIN_QUERY_ROOT, 'newsSources'] as const,
  list: (channel: NewsChannel | null) => [...newsSourceKeys.all, 'list', channel] as const,
  source: (id: string) => [...newsSourceKeys.all, 'source', id] as const,
  publishers: () => [...newsSourceKeys.all, 'publishers'] as const,
  settings: () => [...newsSourceKeys.all, 'settings'] as const,
  clients: () => [...newsSourceKeys.all, 'clients'] as const,
}

/** GET /admin/news-sources?channel=: the partner newspapers first, then by tag. */
export function useAdminNewsSources(channel: NewsChannel | null = null) {
  return useQuery({
    queryKey: newsSourceKeys.list(channel),
    queryFn: ({ signal }) => adminApi.newsSources(channel, signal),
  })
}

/** GET /admin/news-sources/{id}: the newspaper and its News providers. */
export function useAdminNewsSource(id: string | null) {
  return useQuery({
    queryKey: newsSourceKeys.source(id ?? ''),
    queryFn: ({ signal }) => adminApi.newsSource(id ?? '', signal),
    enabled: id !== null,
  })
}

/** The newspaper as the server answered it, then every list asked again. */
function useKeepSource() {
  const queryClient = useQueryClient()
  const refresh = useRefreshAdminData()
  return (details: AdminNewsSourceDetailsDto) => {
    queryClient.setQueryData(newsSourceKeys.source(details.source.id), details)
    refresh()
  }
}

/** PUT /admin/news-sources/{id}: its description, verification, moderation and contract. */
export function useSaveNewsSource() {
  const keep = useKeepSource()
  return useMutation({
    mutationFn: ({ id, source }: { id: string; source: AdminNewsSourceWriteDto }) =>
      adminApi.saveNewsSource(id, source),
    onSuccess: keep,
  })
}

/** PUT /admin/news-sources/{id}/logo: a PNG, JPEG or WebP image of 512 KB at most. */
export function useUploadNewsSourceLogo() {
  const keep = useKeepSource()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminApi.uploadNewsSourceLogo(id, file),
    onSuccess: keep,
  })
}

/** DELETE /admin/news-sources/{id}/logo: the card shows the initials again. */
export function useRemoveNewsSourceLogo() {
  const keep = useKeepSource()
  return useMutation({ mutationFn: adminApi.removeNewsSourceLogo, onSuccess: keep })
}

/** GET /admin/publishers: the domains the Data admin named (NEWS). */
export function usePublishers() {
  return useQuery({
    queryKey: newsSourceKeys.publishers(),
    queryFn: ({ signal }) => adminApi.publishers(signal),
  })
}

/** PUT /admin/publishers: a domain named or renamed; its newspapers take the names. */
export function useSavePublisher() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (publisher: PublisherWriteDto) => adminApi.savePublisher(publisher),
    onSuccess: refresh,
  })
}

/** DELETE /admin/publishers/{id}: its newspapers keep their names. */
export function useRemovePublisher() {
  const refresh = useRefreshAdminData()
  return useMutation({ mutationFn: adminApi.removePublisher, onSuccess: refresh })
}

/** GET /admin/news-settings: the AI's moderation and threshold, the views an hour. */
export function useNewsSettings() {
  return useQuery({
    queryKey: newsSourceKeys.settings(),
    queryFn: ({ signal }) => adminApi.newsSettings(signal),
  })
}

export function useSaveNewsSettings() {
  const queryClient = useQueryClient()
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (settings: NewsSettingsWriteDto) => adminApi.saveNewsSettings(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(newsSourceKeys.settings(), settings)
      refresh()
    },
  })
}

/** GET /admin/ingest-clients: the active ones first, newest first. */
export function useIngestClients() {
  return useQuery({
    queryKey: newsSourceKeys.clients(),
    queryFn: ({ signal }) => adminApi.ingestClients(signal),
  })
}

/** POST /admin/ingest-clients: the answer carries the secret, shown this once. */
export function useCreateIngestClient() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (client: IngestClientWriteDto) => adminApi.createIngestClient(client),
    onSuccess: refresh,
  })
}

/** DELETE /admin/ingest-clients/{id}: its next call is refused. */
export function useRevokeIngestClient() {
  const refresh = useRefreshAdminData()
  return useMutation({ mutationFn: adminApi.revokeIngestClient, onSuccess: refresh })
}
