import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { MoversType } from '@/shared/api/contracts'
import { marketApi } from '@/shared/api/endpoints'
import { periodRange, type ChartPeriod } from '@/shared/lib/chartPeriods'

export const marketKeys = {
  all: ['market'] as const,
  status: () => [...marketKeys.all, 'status'] as const,
  summary: () => [...marketKeys.all, 'summary'] as const,
  movers: (type: MoversType) => [...marketKeys.all, 'movers', type] as const,
  ticker: () => [...marketKeys.all, 'ticker'] as const,
  indices: () => [...marketKeys.all, 'indices'] as const,
  indexHistory: (code: string, period: ChartPeriod) =>
    [...marketKeys.all, 'indices', code, 'history', period] as const,
}

export function useMarketStatus() {
  return useQuery({
    queryKey: marketKeys.status(),
    queryFn: ({ signal }) => marketApi.status(signal),
    refetchInterval: 60_000,
  })
}

export function useMarketSummary() {
  return useQuery({
    queryKey: marketKeys.summary(),
    queryFn: ({ signal }) => marketApi.summary(signal),
    refetchInterval: 60_000,
  })
}

export function useMarketMovers(type: MoversType) {
  return useQuery({
    queryKey: marketKeys.movers(type),
    queryFn: ({ signal }) => marketApi.movers(type, signal),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useTicker() {
  return useQuery({
    queryKey: marketKeys.ticker(),
    queryFn: ({ signal }) => marketApi.ticker(signal),
    refetchInterval: 60_000,
  })
}

/** GET /indices: the indices CMarket computes or receives, e.g. for a portfolio's benchmark. */
export function useIndices() {
  return useQuery({
    queryKey: marketKeys.indices(),
    queryFn: ({ signal }) => marketApi.indices(signal),
    staleTime: 5 * 60_000,
  })
}

export function indexHistoryQuery(code: string, period: ChartPeriod) {
  return queryOptions({
    queryKey: marketKeys.indexHistory(code, period),
    // The range is computed at fetch time, so a refetch follows the clock.
    queryFn: ({ signal }) => marketApi.indexHistory(code, periodRange(period), signal),
  })
}

export function useIndexHistory(code: string | undefined, period: ChartPeriod) {
  return useQuery({ ...indexHistoryQuery(code ?? '', period), enabled: Boolean(code) })
}
