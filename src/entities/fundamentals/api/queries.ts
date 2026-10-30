import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  ComparisonItemDto,
  FinancialStatement,
  FinancialStatementDto,
  RatiosDto,
} from '@/shared/api/contracts'

/** Fiscal years shown by the statements (spec section 9, screen 3). */
const STATEMENT_YEARS = 5
/** Accounts change once a year; ratios move with the price. */
const ACCOUNTS_STALE_MS = 60 * 60_000
const RATIOS_STALE_MS = 60_000

export const fundamentalsKeys = {
  all: ['fundamentals'] as const,
  ratios: (id: string) => [...fundamentalsKeys.all, 'ratios', id] as const,
  financials: (id: string, statement: FinancialStatement) =>
    [...fundamentalsKeys.all, 'financials', id, statement] as const,
  comparison: (ids: readonly string[]) =>
    [...fundamentalsKeys.all, 'comparison', [...ids].sort().join(',')] as const,
}

const securityPath = (id: string, suffix: string) =>
  `/securities/${encodeURIComponent(id)}${suffix}`

/** GET /securities/{id}/ratios: an equity's ratios and its sector's averages. */
export function useRatios(securityId: string | undefined) {
  return useQuery({
    queryKey: fundamentalsKeys.ratios(securityId ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<RatiosDto>(securityPath(securityId ?? '', '/ratios'), { signal }),
    enabled: Boolean(securityId),
    staleTime: RATIOS_STALE_MS,
  })
}

/** GET /securities/{id}/financials?statement=&years=5 */
export function useFinancials(securityId: string | undefined, statement: FinancialStatement) {
  return useQuery({
    queryKey: fundamentalsKeys.financials(securityId ?? '', statement),
    queryFn: ({ signal }) =>
      apiClient.get<FinancialStatementDto>(securityPath(securityId ?? '', '/financials'), {
        query: { statement, years: STATEMENT_YEARS },
        signal,
      }),
    enabled: Boolean(securityId),
    staleTime: ACCOUNTS_STALE_MS,
  })
}

/**
 * GET /analysis/compare?ids=: the ratios of a peer group. Cached by the group, whatever the
 * order, so selecting another member does not load it again.
 */
export function useComparison(ids: readonly string[]) {
  return useQuery({
    queryKey: fundamentalsKeys.comparison(ids),
    queryFn: ({ signal }) =>
      apiClient.get<ComparisonItemDto[]>('/analysis/compare', {
        query: { ids: [...ids].sort().join(',') },
        signal,
      }),
    enabled: ids.length > 0,
    staleTime: RATIOS_STALE_MS,
    placeholderData: keepPreviousData,
  })
}
