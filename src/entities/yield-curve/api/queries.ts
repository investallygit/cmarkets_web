import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { bondsApi, type YieldCurveQuery } from '@/shared/api/endpoints'

export type { YieldCurveQuery }

export const yieldCurveKeys = {
  all: ['yield-curves'] as const,
  list: (query: YieldCurveQuery) => [...yieldCurveKeys.all, query] as const,
}

/** GET /yield-curves?country=&date=: one curve per country, shortest maturity first. */
export function useYieldCurves(query: YieldCurveQuery = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: yieldCurveKeys.list(query),
    queryFn: ({ signal }) => bondsApi.yieldCurves(query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}
