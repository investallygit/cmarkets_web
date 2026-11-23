import { keepPreviousData, queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import type { IndexQuoteDto } from '@/shared/api/contracts'
import { marketApi } from '@/shared/api/endpoints'
import { marketKeys } from './queries'

/** The index profile's queries (spec section 9, screen 31, fifth version). */
const profileKeys = {
  profile: (code: string) => [...marketKeys.indices(), code, 'profile'] as const,
  sessions: (code: string, last: number) =>
    [...marketKeys.indices(), code, 'sessions', last] as const,
  constituents: (code: string, date: string | null) =>
    [...marketKeys.indices(), code, 'constituents', date] as const,
  members: (code: string) => [...marketKeys.indices(), code, 'members'] as const,
  performance: (code: string) => [...marketKeys.indices(), code, 'performance'] as const,
  documents: (code: string) => [...marketKeys.indices(), code, 'documents'] as const,
}

/** GET /indices/{code}: the header, read again each minute as the fixing comes. */
export function useIndexProfile(code: string) {
  return useQuery({
    queryKey: profileKeys.profile(code),
    queryFn: ({ signal }) => marketApi.indexProfile(code, signal),
    refetchInterval: 60_000,
  })
}

export function useIndexSessions(code: string, last: number) {
  return useQuery({
    queryKey: profileKeys.sessions(code, last),
    queryFn: ({ signal }) => marketApi.indexSessions(code, last, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

/** The composition on a session: the latest while `date` is null. */
export function useIndexConstituents(code: string, date: string | null) {
  return useQuery({
    queryKey: profileKeys.constituents(code, date),
    queryFn: ({ signal }) => marketApi.indexConstituents(code, date, signal),
    placeholderData: keepPreviousData,
    refetchInterval: date ? false : 60_000,
  })
}

/** Every member the index had: read when the history file is asked for. */
export function indexMembersQuery(code: string) {
  return queryOptions({
    queryKey: profileKeys.members(code),
    queryFn: ({ signal }) => marketApi.indexMembers(code, signal),
  })
}

export function useIndexPerformance(code: string) {
  return useQuery({
    queryKey: profileKeys.performance(code),
    queryFn: ({ signal }) => marketApi.indexPerformance(code, signal),
    staleTime: 5 * 60_000,
  })
}

export function useIndexDocuments(code: string) {
  return useQuery({
    queryKey: profileKeys.documents(code),
    queryFn: ({ signal }) => marketApi.indexDocuments(code, signal),
    staleTime: 5 * 60_000,
  })
}

/**
 * The index a command names ("BVMAC-A DES", "bvmac-a"), from the list of indices; null when the
 * words name none. MCAP, the market's capitalisation, is no index and has no profile (ROADMAP
 * decision 44).
 */
export async function findIndex(
  queryClient: QueryClient,
  query: string,
): Promise<IndexQuoteDto | null> {
  const wanted = query.trim().toUpperCase()
  if (!wanted || wanted === 'MCAP') return null
  const indices = await queryClient.fetchQuery({
    queryKey: marketKeys.indices(),
    queryFn: ({ signal }) => marketApi.indices(signal),
    staleTime: 5 * 60_000,
  })
  return indices.find((index) => index.code.toUpperCase() === wanted) ?? null
}

/** Whether an index has a profile: every one but MCAP. */
export function hasIndexProfile(code: string): boolean {
  return code.toUpperCase() !== 'MCAP'
}
