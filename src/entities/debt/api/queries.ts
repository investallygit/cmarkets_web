import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/shared/api/endpoints'

const STALE = 10 * 60_000

export const debtKeys = {
  all: ['debt'] as const,
  summary: (country: string) => [...debtKeys.all, 'summary', country] as const,
  redemptions: (country: string) => [...debtKeys.all, 'redemptions', country] as const,
  securities: (country: string) => [...debtKeys.all, 'securities', country] as const,
  documents: (country: string) => [...debtKeys.all, 'documents', country] as const,
  compare: () => [...debtKeys.all, 'compare'] as const,
}

/** GET /debt/{country}/summary: DEBT's six indicators (screen 35, sixth version). */
export function useDebtSummary(country: string) {
  return useQuery({
    queryKey: debtKeys.summary(country),
    queryFn: ({ signal }) => marketApi.debtSummary(country, signal),
    staleTime: STALE,
  })
}

/** GET /debt/{country}/redemptions: the principal to repay by quarter, then by year. */
export function useDebtRedemptions(country: string) {
  return useQuery({
    queryKey: debtKeys.redemptions(country),
    queryFn: ({ signal }) => marketApi.debtRedemptions(country, signal),
    staleTime: STALE,
  })
}

/** GET /debt/{country}/securities: the securities outstanding. */
export function useDebtSecurities(country: string) {
  return useQuery({
    queryKey: debtKeys.securities(country),
    queryFn: ({ signal }) => marketApi.debtSecurities(country, signal),
    staleTime: STALE,
  })
}

/** GET /debt/{country}/documents: the agencies' ratings and the state's documents. */
export function useDebtDocuments(country: string) {
  return useQuery({
    queryKey: debtKeys.documents(country),
    queryFn: ({ signal }) => marketApi.debtDocuments(country, signal),
    staleTime: STALE,
  })
}

/** GET /debt/compare: the six states side by side. */
export function useDebtCompare() {
  return useQuery({
    queryKey: debtKeys.compare(),
    queryFn: ({ signal }) => marketApi.debtCompare(signal),
    staleTime: STALE,
  })
}
