import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { SearchResultsDto, SecuritySearchItemDto } from '@/shared/api/contracts'

export const securityKeys = {
  search: (query: string) => ['search', query] as const,
}

function searchSecurities(query: string, signal?: AbortSignal): Promise<SearchResultsDto> {
  return apiClient.get<SearchResultsDto>('/search', { query: { q: query }, signal })
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
