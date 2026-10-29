import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  HistoryPointDto,
  MarketStatusDto,
  MarketSummaryDto,
  MoverDto,
  MoversType,
  TickerItemDto,
} from '@/shared/api/contracts'
import { periodRange, type ChartPeriod } from './periods'

export const marketKeys = {
  all: ['market'] as const,
  status: () => [...marketKeys.all, 'status'] as const,
  summary: () => [...marketKeys.all, 'summary'] as const,
  movers: (type: MoversType) => [...marketKeys.all, 'movers', type] as const,
  ticker: () => [...marketKeys.all, 'ticker'] as const,
  indexHistory: (code: string, period: ChartPeriod) =>
    [...marketKeys.all, 'indices', code, 'history', period] as const,
}

export function useMarketStatus() {
  return useQuery({
    queryKey: marketKeys.status(),
    queryFn: ({ signal }) => apiClient.get<MarketStatusDto>('/market/status', { signal }),
    refetchInterval: 60_000,
  })
}

export function useMarketSummary() {
  return useQuery({
    queryKey: marketKeys.summary(),
    queryFn: ({ signal }) => apiClient.get<MarketSummaryDto>('/market/summary', { signal }),
    refetchInterval: 60_000,
  })
}

export function useMarketMovers(type: MoversType) {
  return useQuery({
    queryKey: marketKeys.movers(type),
    queryFn: ({ signal }) =>
      apiClient.get<MoverDto[]>('/market/movers', { query: { type }, signal }),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useTicker() {
  return useQuery({
    queryKey: marketKeys.ticker(),
    queryFn: ({ signal }) => apiClient.get<TickerItemDto[]>('/market/ticker', { signal }),
    refetchInterval: 60_000,
  })
}

export function useIndexHistory(code: string | undefined, period: ChartPeriod) {
  return useQuery({
    queryKey: marketKeys.indexHistory(code ?? '', period),
    // The range is computed at fetch time, so a refetch follows the clock.
    queryFn: ({ signal }) =>
      apiClient.get<HistoryPointDto[]>(`/indices/${encodeURIComponent(code ?? '')}/history`, {
        query: periodRange(period),
        signal,
      }),
    enabled: Boolean(code),
  })
}
