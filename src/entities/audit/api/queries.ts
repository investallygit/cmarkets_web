import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, apiClient } from '@/shared/api'
import type { AuditAction, AuditEntryDto, Paged } from '@/shared/api/contracts'

/** GET /admin/audit-log?userId=&action=&from=&to= */
export interface AuditQuery {
  /** Who acted, or the account acted on. */
  userId?: string
  /** One action, or several. */
  action?: AuditAction | readonly AuditAction[]
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export const AUDIT_PAGE_SIZE = 50

export const auditKeys = {
  all: [...ADMIN_QUERY_ROOT, 'audit'] as const,
  list: (query: AuditQuery) => [...auditKeys.all, 'list', query] as const,
}

/** The log, newest first, page by page. */
export function useAuditLog(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<AuditEntryDto>>('/admin/audit-log', {
        query: {
          pageSize: AUDIT_PAGE_SIZE,
          ...query,
          action: typeof query.action === 'string' ? query.action : query.action?.join(','),
        },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}
