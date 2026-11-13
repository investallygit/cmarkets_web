import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { marketApi } from '@/shared/api/endpoints'

/** Yearly figures, loaded once a month: an hour is fresh enough. */
const MACRO_STALE_TIME = 60 * 60_000

export const macroKeys = {
  all: ['macro'] as const,
  countries: () => ['macro', 'countries'] as const,
  summary: (iso3: string) => ['macro', 'summary', iso3] as const,
  indicators: () => ['macro', 'indicators'] as const,
  comparison: (countries: readonly string[], indicator: string) =>
    ['macro', 'compare', countries.join(','), indicator] as const,
  cemacTable: () => ['macro', 'cemac-table'] as const,
}

/** Screen 25's selector: the CEMAC's six, Sub-Saharan Africa, the Admin's countries, the World. */
export function useMacroCountries() {
  return useQuery({
    queryKey: macroKeys.countries(),
    queryFn: ({ signal }) => marketApi.macroCountries(signal),
    staleTime: MACRO_STALE_TIME,
  })
}

/** An economy's six key indicator tiles; the previous economy's stay while the next loads. */
export function useMacroSummary(iso3: string | undefined) {
  return useQuery({
    queryKey: macroKeys.summary(iso3 ?? ''),
    queryFn: ({ signal }) => marketApi.macroSummary(iso3 ?? '', signal),
    enabled: iso3 !== undefined,
    placeholderData: keepPreviousData,
    staleTime: MACRO_STALE_TIME,
  })
}

/** The 37 indicators ECO offers, their names, units and groups. */
export function useMacroIndicators() {
  return useQuery({
    queryKey: macroKeys.indicators(),
    queryFn: ({ signal }) => marketApi.macroIndicators(signal),
    staleTime: Infinity,
  })
}

/**
 * An indicator's figures for up to six economies, every year since 1960: the chart's periods cut
 * them on screen, without asking again.
 */
export function useMacroComparison(countries: readonly string[], indicator: string) {
  return useQuery({
    queryKey: macroKeys.comparison(countries, indicator),
    queryFn: ({ signal }) => marketApi.macroCompare({ countries, indicator }, signal),
    enabled: countries.length > 0,
    placeholderData: keepPreviousData,
    staleTime: MACRO_STALE_TIME,
  })
}

/** The CEMAC comparison of the mockup: the six and Sub-Saharan Africa on its seven indicators. */
export function useCemacTable() {
  return useQuery({
    queryKey: macroKeys.cemacTable(),
    queryFn: ({ signal }) => marketApi.cemacTable(undefined, signal),
    staleTime: MACRO_STALE_TIME,
  })
}
