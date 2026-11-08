import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT } from '@/shared/api'
import { adminApi, type AuditQuery } from '@/shared/api/endpoints'

export type { AuditQuery }

export const AUDIT_PAGE_SIZE = 50

export const auditKeys = {
  all: [...ADMIN_QUERY_ROOT, 'audit'] as const,
  list: (query: AuditQuery) => [...auditKeys.all, 'list', query] as const,
}

/** The log, newest first, page by page. */
export function useAuditLog(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ signal }) => adminApi.auditLog({ pageSize: AUDIT_PAGE_SIZE, ...query }, signal),
    placeholderData: keepPreviousData,
  })
}
