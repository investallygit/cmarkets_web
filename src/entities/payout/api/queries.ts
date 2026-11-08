import { useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import { adminApi, type PayoutQuery } from '@/shared/api/endpoints'

export type { PayoutQuery }

export const payoutKeys = {
  all: [...ADMIN_QUERY_ROOT, 'payouts'] as const,
  list: (query: PayoutQuery) => [...payoutKeys.all, 'list', query] as const,
}

/** Every analyst's monthly statements, newest month first. */
export function useAdminPayouts(query: PayoutQuery = {}) {
  return useQuery({
    queryKey: payoutKeys.list(query),
    queryFn: ({ signal }) => adminApi.payouts(query, signal),
  })
}

/** POST /admin/payouts/{id}/mark-paid: the transfer to the analyst was made. */
export function useMarkPayoutPaid() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.markPayoutPaid,
    onSuccess: refresh,
  })
}
