import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { DocumentDto, DocumentType, DocumentWriteDto, Paged } from '@/shared/api/contracts'

export interface DocumentQuery {
  securityId?: string
  type?: DocumentType
  /** Full-text search (spec section 5). */
  q?: string
  pageSize?: number
}

export const documentKeys = {
  all: ['documents'] as const,
  list: (query: DocumentQuery) => [...documentKeys.all, 'list', query] as const,
  file: (id: string) => [...documentKeys.all, 'file', id] as const,
}

/** GET /documents: issuer releases, reports, notices and decisions, newest first. */
export function useDocuments({ pageSize = 50, ...filters }: DocumentQuery = {}) {
  return useQuery({
    queryKey: documentKeys.list({ pageSize, ...filters }),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<DocumentDto>>('/documents', {
        query: { ...filters, page: 1, pageSize },
        signal,
      }),
  })
}

/** GET /documents/{id}/file: the PDF, which never changes once published. */
export function useDocumentFile(id: string | null) {
  return useQuery({
    queryKey: documentKeys.file(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.getBlob(`/documents/${encodeURIComponent(id ?? '')}/file`, { signal }),
    staleTime: Infinity,
    enabled: Boolean(id),
  })
}

/**
 * POST /data/documents, or PUT /data/documents/{id}: a multipart form with the PDF, which an edit
 * may leave out to keep the current one.
 */
export function useSaveDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      document,
      file,
    }: {
      id: string | null
      document: DocumentWriteDto
      file: File | null
    }) => {
      const form = new FormData()
      form.set('type', document.type)
      form.set('title', document.title)
      form.set('source', document.source)
      document.securityIds.forEach((securityId) => form.append('securityIds', securityId))
      if (file) form.set('file', file)
      return id
        ? apiClient.putForm<DocumentDto>(`/data/documents/${encodeURIComponent(id)}`, form)
        : apiClient.postForm<DocumentDto>('/data/documents', form)
    },
    // A new file under the same id: the cached PDF goes too.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}
