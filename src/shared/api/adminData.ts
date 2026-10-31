import { useQueryClient } from '@tanstack/react-query'

/**
 * First part of the query keys of the Admin's data: accounts, requests, moderation, payouts,
 * settings and the audit log.
 */
export const ADMIN_QUERY_ROOT = ['admin'] as const

/**
 * An Admin's action changes several lists and writes to the audit log: all are asked again.
 * The mutation does not wait for them, so the caller's own callbacks run while the row or form
 * that started it is still on screen (the refreshed list may remove it).
 */
export function useRefreshAdminData() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_ROOT })
  }
}
