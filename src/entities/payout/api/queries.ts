import { useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, apiClient, useRefreshAdminData } from '@/shared/api'
import type { AdminPayoutDto, PayoutStatus } from '@/shared/api/contracts'

/** GET /admin/payouts?month=&status=&analystId= */
export interface PayoutQuery {
  /** YYYY-MM */
  month?: string
  status?: PayoutStatus
  analystId?: string
}

export const payoutKeys = {
  all: [...ADMIN_QUERY_ROOT, 'payouts'] as const,
  list: (query: PayoutQuery) => [...payoutKeys.all, 'list', query] as const,
}

/** Every analyst's monthly statements, newest month first. */
export function useAdminPayouts(query: PayoutQuery = {}) {
  return useQuery({
    queryKey: payoutKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<AdminPayoutDto[]>('/admin/payouts', { query: { ...query }, signal }),
  })
}

/** POST /admin/payouts/{id}/mark-paid: the transfer to the analyst was made. */
export function useMarkPayoutPaid() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<AdminPayoutDto>(`/admin/payouts/${encodeURIComponent(id)}/mark-paid`),
    onSuccess: refresh,
  })
}
