import { useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, apiClient, useRefreshAdminData } from '@/shared/api'
import type { AnalystRequestDto, SignUpDocument, VerificationStatus } from '@/shared/api/contracts'

export const analystRequestKeys = {
  all: [...ADMIN_QUERY_ROOT, 'analyst-requests'] as const,
  list: (status: VerificationStatus) => [...analystRequestKeys.all, 'list', status] as const,
  document: (id: string, kind: SignUpDocument) =>
    [...analystRequestKeys.all, 'document', id, kind] as const,
}

const requestPath = (id: string, action: string) =>
  `/admin/analyst-requests/${encodeURIComponent(id)}/${action}`

/**
 * GET /admin/analyst-requests?status=: the requests of Analysts, Journalists and CEOs, waiting by
 * default, newest first.
 */
export function useAnalystRequests(status: VerificationStatus = 'pending') {
  return useQuery({
    queryKey: analystRequestKeys.list(status),
    queryFn: ({ signal }) =>
      apiClient.get<AnalystRequestDto[]>('/admin/analyst-requests', { query: { status }, signal }),
  })
}

/** GET /admin/analyst-requests/{id}/documents/{kind}: a supporting document, as a PDF. */
export function useAnalystDocument(id: string | null, kind: SignUpDocument | null) {
  return useQuery({
    queryKey: analystRequestKeys.document(id ?? '', kind ?? 'cv'),
    queryFn: ({ signal }) =>
      apiClient.getBlob(requestPath(id ?? '', `documents/${kind ?? ''}`), { signal }),
    staleTime: Infinity,
    enabled: id !== null && kind !== null,
  })
}

/** POST /admin/analyst-requests/{id}/approve: the analyst may publish. */
export function useApproveAnalyst() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (id: string) => apiClient.post<AnalystRequestDto>(requestPath(id, 'approve')),
    onSuccess: refresh,
  })
}

/** POST /admin/analyst-requests/{id}/reject, with the reason the user is told. */
export function useRejectAnalyst() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<AnalystRequestDto>(requestPath(id, 'reject'), { reason }),
    onSuccess: refresh,
  })
}
