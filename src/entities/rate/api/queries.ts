import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { GlobalRatesSet } from '@/shared/api/contracts'
import { marketApi } from '@/shared/api/endpoints'
import { fxPeriodRange, type FxPeriod } from '../lib/fxPeriods'

/** The ECB publishes its reference rates once a business day: ten minutes is fresh enough. */
const FX_STALE_TIME = 10 * 60_000

export const ratesKeys = {
  policy: ['rates', 'policy'] as const,
  fx: (pairs: readonly string[]) => ['fx', pairs.join(',')] as const,
  crosses: () => ['fx', 'crosses'] as const,
  fxHistory: (currency: string, period: FxPeriod) => ['fx', 'history', currency, period] as const,
  conversion: (amount: number, from: string, to: string) =>
    ['fx', 'convert', amount, from, to] as const,
  matrix: () => ['fx', 'matrix'] as const,
  globalRates: (set: GlobalRatesSet) => ['rates', 'global', set] as const,
}

export function usePolicyRates() {
  return useQuery({
    queryKey: ratesKeys.policy,
    queryFn: ({ signal }) => marketApi.policyRates(signal),
    staleTime: 60 * 60_000,
  })
}

/** MKT's rates of the franc: the ECB's reference rates of FX (ROADMAP decision 22). */
export function useFxRates(pairs: readonly string[]) {
  return useQuery({
    queryKey: ratesKeys.fx(pairs),
    queryFn: ({ signal }) => marketApi.fx(pairs, signal),
    refetchInterval: FX_STALE_TIME,
  })
}

/** Screen 26: the parity and the Admin's currencies against the XAF, at today's reference rates. */
export function useXafCrosses() {
  return useQuery({
    queryKey: ratesKeys.crosses(),
    queryFn: ({ signal }) => marketApi.xafCrosses(undefined, signal),
    staleTime: FX_STALE_TIME,
  })
}

/** A currency against the XAF over a period of screen 26's chart, with the year to its last point. */
export function useFxHistory(currency: string | undefined, period: FxPeriod) {
  return useQuery({
    queryKey: ratesKeys.fxHistory(currency ?? '', period),
    queryFn: ({ signal }) => marketApi.fxHistory(currency ?? '', fxPeriodRange(period), signal),
    enabled: currency !== undefined,
    staleTime: FX_STALE_TIME,
  })
}

/**
 * An amount in another currency at today's reference rates (EUR and XAF at the parity); the
 * previous result stays on screen while the next is asked.
 */
export function useFxConversion(amount: number | null, from: string, to: string) {
  return useQuery({
    queryKey: ratesKeys.conversion(amount ?? 0, from, to),
    queryFn: ({ signal }) => marketApi.fxConvert({ amount: amount ?? 0, from, to }, signal),
    enabled: amount !== null && amount >= 0,
    placeholderData: keepPreviousData,
    staleTime: FX_STALE_TIME,
  })
}

/** The cross rates of the Admin's currencies: 1 unit in row = … in column. */
export function useFxMatrix() {
  return useQuery({
    queryKey: ratesKeys.matrix(),
    queryFn: ({ signal }) => marketApi.fxMatrix(undefined, signal),
    staleTime: FX_STALE_TIME,
  })
}

/** Screen 25's sovereign and reference rates, or screen 26's euro area benchmarks. */
export function useGlobalRates(set: GlobalRatesSet) {
  return useQuery({
    queryKey: ratesKeys.globalRates(set),
    queryFn: ({ signal }) => marketApi.globalRates(set, signal),
    staleTime: FX_STALE_TIME,
  })
}
