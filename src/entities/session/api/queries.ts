import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { MeDto, MeUpdateDto, PasswordChangeDto, Permission } from '@/shared/api/contracts'

export const sessionKeys = { me: ['me'] as const, restore: ['session', 'restore'] as const }

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

/** The editable part of /me, to send back with one field changed. */
export function profileOf(me: MeDto): MeUpdateDto {
  const { displayName, phone, language, timeZone, twoFactorChannel } = me
  return { displayName, phone, language, timeZone, twoFactorChannel }
}

/** PUT /me: the profile of CFG; the language and time zone apply at once. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (update: MeUpdateDto) => apiClient.put<MeDto>('/me', update),
    onSuccess: (me) => queryClient.setQueryData(sessionKeys.me, me),
  })
}

/** PUT /me/password: the current password, then the new one. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (change: PasswordChangeDto) => apiClient.put<void>('/me/password', change),
  })
}
