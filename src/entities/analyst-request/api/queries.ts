import { useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import type { SignUpDocument, VerificationStatus } from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'

export const analystRequestKeys = {
  all: [...ADMIN_QUERY_ROOT, 'analyst-requests'] as const,
  list: (status: VerificationStatus) => [...analystRequestKeys.all, 'list', status] as const,
  document: (id: string, kind: SignUpDocument) =>
    [...analystRequestKeys.all, 'document', id, kind] as const,
}

/**
 * GET /admin/analyst-requests?status=: the requests of Analysts, Journalists and CEOs, waiting by
 * default, newest first.
 */
export function useAnalystRequests(status: VerificationStatus = 'pending') {
  return useQuery({
    queryKey: analystRequestKeys.list(status),
    queryFn: ({ signal }) => adminApi.analystRequests(status, signal),
  })
}

/** GET /admin/analyst-requests/{id}/documents/{kind}: a supporting document, as a PDF. */
export function useAnalystDocument(id: string | null, kind: SignUpDocument | null) {
  return useQuery({
    queryKey: analystRequestKeys.document(id ?? '', kind ?? 'cv'),
    queryFn: ({ signal }) => adminApi.analystDocument(id ?? '', kind ?? 'cv', signal),
    staleTime: Infinity,
    enabled: id !== null && kind !== null,
  })
}

/** POST /admin/analyst-requests/{id}/approve: the analyst may publish. */
export function useApproveAnalyst() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.approveAnalyst,
    onSuccess: refresh,
  })
}

/** POST /admin/analyst-requests/{id}/reject, with the reason the user is told. */
export function useRejectAnalyst() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectAnalyst(id, reason),
    onSuccess: refresh,
  })
}
