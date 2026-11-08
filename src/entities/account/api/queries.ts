import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import type { AccountType } from '@/shared/api/contracts'
import { adminApi, type AccountQuery } from '@/shared/api/endpoints'

export type { AccountQuery }

export const ACCOUNTS_PAGE_SIZE = 50

export const accountKeys = {
  all: [...ADMIN_QUERY_ROOT, 'accounts'] as const,
  list: (query: AccountQuery) => [...accountKeys.all, 'list', query] as const,
  counts: () => [...accountKeys.all, 'counts'] as const,
  details: (id: string) => [...accountKeys.all, 'details', id] as const,
  organizations: () => [...accountKeys.all, 'organizations'] as const,
}

/** GET /admin/users?type=&status=&q=&sort=&page=: a page of the accounts. */
export function useAccounts(query: AccountQuery, enabled = true) {
  return useQuery({
    queryKey: accountKeys.list(query),
    queryFn: ({ signal }) => adminApi.users({ pageSize: ACCOUNTS_PAGE_SIZE, ...query }, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** GET /admin/users/counts: the active accounts by type. */
export function useAccountCounts() {
  return useQuery({
    queryKey: accountKeys.counts(),
    queryFn: ({ signal }) => adminApi.userCounts(signal),
  })
}

/** GET /admin/users/{id}: type, subscription, logins, purchases, publications. */
export function useAccount(id: string | null) {
  return useQuery({
    queryKey: accountKeys.details(id ?? ''),
    queryFn: ({ signal }) => adminApi.user(id ?? '', signal),
    enabled: id !== null,
  })
}

/** GET /admin/organizations: those an account can be put in. */
export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: accountKeys.organizations(),
    queryFn: ({ signal }) => adminApi.organizations(signal),
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** GET /admin/users/export: every account of the filters as CSV, not only the page shown. */
export function useExportAccounts() {
  return useMutation({
    mutationFn: adminApi.exportUsers,
  })
}

/** POST /admin/users, including Data admin and Admin accounts. */
export function useCreateAccount() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: refresh,
  })
}

/** PUT /admin/users/{id}/type */
export function useChangeAccountType() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, accountType }: { id: string; accountType: AccountType }) =>
      adminApi.changeType(id, accountType),
    onSuccess: refresh,
  })
}

/** POST /admin/users/{id}/suspend or /reactivate, with the reason the log keeps. */
export function useSuspendAccount() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, suspend, reason }: { id: string; suspend: boolean; reason: string }) =>
      adminApi.suspend(id, suspend, reason),
    onSuccess: refresh,
  })
}

/** POST /admin/users/{id}/reset-mfa: codes by e-mail again, every session ended. */
export function useResetTwoFactor() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.resetMfa,
    onSuccess: refresh,
  })
}
