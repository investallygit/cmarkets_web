import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DocumentType, DocumentWriteDto } from '@/shared/api/contracts'
import { contentApi, dataAdminApi } from '@/shared/api/endpoints'

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
    queryFn: ({ signal }) => contentApi.documents(filters, { page: 1, pageSize }, signal),
  })
}

/** GET /documents/{id}/file: the PDF, which never changes once published. */
export function useDocumentFile(id: string | null) {
  return useQuery({
    queryKey: documentKeys.file(id ?? ''),
    queryFn: ({ signal }) => contentApi.documentFile(id ?? '', signal),
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
    }) => dataAdminApi.saveDocument(id, document, file),
    // A new file under the same id: the cached PDF goes too.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}
