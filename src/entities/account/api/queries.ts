import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, apiClient, useRefreshAdminData } from '@/shared/api'
import type {
  AccountCountsDto,
  AccountListStatus,
  AccountType,
  AdminUserCreateDto,
  AdminUserDetailsDto,
  AdminUserDto,
  Paged,
} from '@/shared/api/contracts'

/** GET /admin/users: search, filters, sorting and page. */
export interface AccountQuery {
  q?: string
  type?: AccountType
  status?: AccountListStatus
  /** A column of the list, "-" first for a descending order: "-lastLoginAt". */
  sort?: string
  page?: number
  pageSize?: number
}

export const ACCOUNTS_PAGE_SIZE = 50

export const accountKeys = {
  all: [...ADMIN_QUERY_ROOT, 'accounts'] as const,
  list: (query: AccountQuery) => [...accountKeys.all, 'list', query] as const,
  counts: () => [...accountKeys.all, 'counts'] as const,
  details: (id: string) => [...accountKeys.all, 'details', id] as const,
  organizations: () => [...accountKeys.all, 'organizations'] as const,
}

const accountPath = (id: string, action = '') =>
  `/admin/users/${encodeURIComponent(id)}${action && `/${action}`}`

/** GET /admin/users?type=&status=&q=&sort=&page=: a page of the accounts. */
export function useAccounts(query: AccountQuery, enabled = true) {
  return useQuery({
    queryKey: accountKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<AdminUserDto>>('/admin/users', {
        query: { pageSize: ACCOUNTS_PAGE_SIZE, ...query },
        signal,
      }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** GET /admin/users/counts: the active accounts by type. */
export function useAccountCounts() {
  return useQuery({
    queryKey: accountKeys.counts(),
    queryFn: ({ signal }) => apiClient.get<AccountCountsDto>('/admin/users/counts', { signal }),
  })
}

/** GET /admin/users/{id}: type, subscription, logins, purchases, publications. */
export function useAccount(id: string | null) {
  return useQuery({
    queryKey: accountKeys.details(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<AdminUserDetailsDto>(accountPath(id ?? ''), { signal }),
    enabled: id !== null,
  })
}

/** GET /admin/organizations: those an account can be put in. */
export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: accountKeys.organizations(),
    queryFn: ({ signal }) =>
      apiClient.get<{ id: string; name: string }[]>('/admin/organizations', { signal }),
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** GET /admin/users/export: every account of the filters as CSV, not only the page shown. */
export function useExportAccounts() {
  return useMutation({
    mutationFn: (query: Omit<AccountQuery, 'page' | 'pageSize'>) =>
      apiClient.getBlob('/admin/users/export', { query: { ...query } }),
  })
}

/** POST /admin/users, including Data admin and Admin accounts. */
export function useCreateAccount() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (account: AdminUserCreateDto) =>
      apiClient.post<AdminUserDetailsDto>('/admin/users', account),
    onSuccess: refresh,
  })
}

/** PUT /admin/users/{id}/type */
export function useChangeAccountType() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, accountType }: { id: string; accountType: AccountType }) =>
      apiClient.put<AdminUserDetailsDto>(accountPath(id, 'type'), { accountType }),
    onSuccess: refresh,
  })
}

/** POST /admin/users/{id}/suspend or /reactivate, with the reason the log keeps. */
export function useSuspendAccount() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, suspend, reason }: { id: string; suspend: boolean; reason: string }) =>
      apiClient.post<AdminUserDetailsDto>(accountPath(id, suspend ? 'suspend' : 'reactivate'), {
        reason,
      }),
    onSuccess: refresh,
  })
}

/** POST /admin/users/{id}/reset-mfa: codes by e-mail again, every session ended. */
export function useResetTwoFactor() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (id: string) => apiClient.post<AdminUserDetailsDto>(accountPath(id, 'reset-mfa')),
    onSuccess: refresh,
  })
}
