import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { IsoDate } from '@/shared/api/contracts'
import { bondsApi } from '@/shared/api/endpoints'
import { bondScreenerKeys } from './screener'

/**
 * The bond profile (screen 20): under BS's root, so that a publication of the bond list, its
 * ratings, prices or curves refreshes it with the daily figures.
 */
export const bondProfileKeys = {
  history: (id: string, from: IsoDate | null) =>
    [...bondScreenerKeys.all, 'history', id, from ?? 'year'] as const,
  ratings: (id: string) => [...bondScreenerKeys.all, 'ratings', id] as const,
  cashFlows: (id: string) => [...bondScreenerKeys.all, 'cash-flows', id] as const,
}

/**
 * GET /bonds/{id}/analytics/history: the daily figures from a date, the last year without one.
 * The previous period stays on screen while the next one loads.
 */
export function useBondHistory(id: string, from: IsoDate | null) {
  return useQuery({
    queryKey: bondProfileKeys.history(id, from),
    queryFn: ({ signal }) => bondsApi.analyticsHistory(id, from ? { from } : {}, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

/** GET /bonds/{id}/ratings: the agencies' ratings in force, the composite and the ratings given. */
export function useBondRatings(id: string) {
  return useQuery({
    queryKey: bondProfileKeys.ratings(id),
    queryFn: ({ signal }) => bondsApi.ratings(id, signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /bonds/{id}/cashflows: the payments from today and the days to the next coupon. */
export function useBondCashFlows(id: string) {
  return useQuery({
    queryKey: bondProfileKeys.cashFlows(id),
    queryFn: ({ signal }) => bondsApi.cashFlows(id, signal),
    staleTime: 5 * 60_000,
  })
}
