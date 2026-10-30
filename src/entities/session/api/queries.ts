import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { MeDto, Permission } from '@/shared/api/contracts'

export const sessionKeys = { me: ['me'] as const }

export function useMe() {
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: ({ signal }) => apiClient.get<MeDto>('/me', { signal }),
    staleTime: 5 * 60_000,
  })
}

/** The app shell renders screens only once /me is loaded, so screens can rely on it. */
export function useCurrentUser(): MeDto {
  const { data } = useMe()
  if (!data) throw new Error('useCurrentUser() needs the session loaded by the app shell.')
  return data
}

export function useHasPermission(permission: Permission): boolean {
  return useCurrentUser().permissions.includes(permission)
}
