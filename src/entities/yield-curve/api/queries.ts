import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { YieldCurveDto } from '@/shared/api/contracts'

export interface YieldCurveQuery {
  /** The latest session when absent. */
  date?: string
  /** Every CEMAC country when absent. */
  country?: string
}

export const yieldCurveKeys = {
  all: ['yield-curves'] as const,
  list: (query: YieldCurveQuery) => [...yieldCurveKeys.all, query] as const,
}

/** GET /yield-curves?country=&date=: one curve per country, shortest maturity first. */
export function useYieldCurves(query: YieldCurveQuery = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: yieldCurveKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<YieldCurveDto[]>('/yield-curves', { query: { ...query }, signal }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}
