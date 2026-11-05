import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient, useRefreshAdminData } from '@/shared/api'
import type {
  AdminConversationDto,
  ReportedItemDto,
  ReportedItemType,
} from '@/shared/api/contracts'
import { moderationKeys } from './queries'

/** GET /admin/reports: the profiles and conversations reported, the referred accounts first. */
export function useDirectoryReports() {
  return useQuery({
    queryKey: moderationKeys.reports(),
    queryFn: ({ signal }) => apiClient.get<ReportedItemDto[]>('/admin/reports', { signal }),
  })
}

/** POST /admin/reports/{type}/{id}/dismiss, the prototype's: nothing breaks the rules. */
export function useDismissReports() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ type, id }: { type: ReportedItemType; id: string }) =>
      apiClient.post<void>(`/admin/reports/${type}/${encodeURIComponent(id)}/dismiss`),
    onSuccess: refresh,
  })
}

/**
 * GET /admin/conversations/{id}, once the Admin asks: each reading is written to the audit log,
 * so the conversation is read again on a new opening only, not by the refresh of the Admin's
 * lists.
 */
export function useReportedConversation(id: string | null) {
  return useQuery({
    queryKey: ['reportedConversation', id ?? ''] as const,
    queryFn: ({ signal }) =>
      apiClient.get<AdminConversationDto>(`/admin/conversations/${encodeURIComponent(id ?? '')}`, {
        signal,
      }),
    enabled: id !== null,
    staleTime: Infinity,
    gcTime: 0,
  })
}
