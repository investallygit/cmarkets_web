import { keepPreviousData, queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import type { IndicatorType, SearchResultsDto, SecuritySearchItemDto } from '@/shared/api/contracts'
import { analysisApi, securitiesApi, type SecurityFilters } from '@/shared/api/endpoints'
import { periodRange, type ChartPeriod } from '@/shared/lib/chartPeriods'

/** The order book and the trades have no real-time event (spec section 10): they are polled. */
const INTRADAY_POLL_MS = 5_000

export const securityKeys = {
  all: ['securities'] as const,
  search: (query: string) => ['search', query] as const,
  of: (id: string) => [...securityKeys.all, id] as const,
  profile: (id: string) => [...securityKeys.of(id), 'profile'] as const,
  /** The texts stored, as CORR shows them; the profile carries the ones the screens show. */
  description: (id: string) => [...securityKeys.of(id), 'description'] as const,
  history: (id: string, period: ChartPeriod) =>
    [...securityKeys.of(id), 'history', period] as const,
  orderBook: (id: string) => [...securityKeys.of(id), 'orderbook'] as const,
  trades: (id: string) => [...securityKeys.of(id), 'trades'] as const,
  dividends: (id: string) => [...securityKeys.of(id), 'dividends'] as const,
  shareholders: (id: string) => [...securityKeys.of(id), 'shareholders'] as const,
  indicator: (id: string, type: IndicatorType, length: number, period: ChartPeriod) =>
    [...securityKeys.of(id), 'indicators', type, length, period] as const,
}

function searchSecurities(query: string, signal?: AbortSignal): Promise<SearchResultsDto> {
  return securitiesApi.search(query, signal)
}

/** Autocomplete of the command bar. */
export function useSecuritySearch(query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: securityKeys.search(q),
    queryFn: ({ signal }) => searchSecurities(q, signal),
    enabled: q.length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/** Resolves what the user typed ("SEMC", "ECMR 6.25 2029") to a single security. */
export async function findSecurity(
  queryClient: QueryClient,
  query: string,
): Promise<SecuritySearchItemDto | null> {
  const q = query.trim()
  const { securities } = await queryClient.fetchQuery({
    queryKey: securityKeys.search(q),
    queryFn: ({ signal }) => searchSecurities(q, signal),
    staleTime: 60_000,
  })
  const wanted = q.toUpperCase()
  const exact = securities.find(
    (security) => security.code.toUpperCase() === wanted || security.id.toUpperCase() === wanted,
  )
  return exact ?? securities.at(0) ?? null
}

export type { SecurityFilters }

/** GET /securities: the securities of a market, e.g. a peer group or the choices of a filter. */
export function useSecurities(filters: SecurityFilters, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['security-list', filters] as const,
    queryFn: ({ signal }) => securitiesApi.list(filters, signal),
    staleTime: 60 * 60_000,
    enabled,
  })
}

/** GET /securities/{id}: reference data, which changes rarely. */
export function useSecurityProfile(id: string | undefined) {
  return useQuery({
    queryKey: securityKeys.profile(id ?? ''),
    queryFn: ({ signal }) => securitiesApi.profile(id ?? '', signal),
    staleTime: 5 * 60_000,
    enabled: Boolean(id),
  })
}

/** Bars of a period, with the period they belong to. */
export function securityHistoryQuery(id: string, period: ChartPeriod) {
  return queryOptions({
    queryKey: securityKeys.history(id, period),
    // The range is computed at fetch time, so a refetch follows the clock.
    queryFn: async ({ signal }) => ({
      period,
      bars: await securitiesApi.history(id, periodRange(period), signal),
    }),
  })
}

/** The previous period stays shown while the next one loads. */
export function useSecurityHistory(id: string, period: ChartPeriod) {
  return useQuery({ ...securityHistoryQuery(id, period), placeholderData: keepPreviousData })
}

/** Best limits; not part of a Student account (spec section 12). */
export function useOrderBook(id: string, enabled = true) {
  return useQuery({
    queryKey: securityKeys.orderBook(id),
    queryFn: ({ signal }) => securitiesApi.orderBook(id, signal),
    refetchInterval: INTRADAY_POLL_MS,
    enabled,
  })
}

export function useTrades(id: string, enabled = true) {
  return useQuery({
    queryKey: securityKeys.trades(id),
    queryFn: ({ signal }) => securitiesApi.trades(id, signal),
    refetchInterval: INTRADAY_POLL_MS,
    enabled,
  })
}

export function useDividends(id: string, enabled = true) {
  return useQuery({
    queryKey: securityKeys.dividends(id),
    queryFn: ({ signal }) => securitiesApi.dividends(id, signal),
    staleTime: 5 * 60_000,
    enabled,
  })
}

export function useShareholders(id: string) {
  return useQuery({
    queryKey: securityKeys.shareholders(id),
    queryFn: ({ signal }) => securitiesApi.shareholders(id, signal),
    staleTime: 5 * 60_000,
  })
}

/** A technical indicator over a chart period, computed by the server (GET /indicators). */
export function useIndicator(
  id: string,
  type: IndicatorType,
  length: number,
  period: ChartPeriod,
  enabled = true,
) {
  return useQuery({
    queryKey: securityKeys.indicator(id, type, length, period),
    queryFn: ({ signal }) =>
      analysisApi.indicator(id, { type, period: length }, periodRange(period), signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}
