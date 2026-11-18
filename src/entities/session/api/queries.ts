import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MeDto, MeUpdateDto, Permission } from '@/shared/api/contracts'
import { meApi } from '@/shared/api/endpoints'

export const sessionKeys = { me: ['me'] as const, restore: ['session', 'restore'] as const }

export function useMe() {
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: ({ signal }) => meApi.get(signal),
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
    mutationFn: meApi.update,
    onSuccess: (me) => queryClient.setQueryData(sessionKeys.me, me),
  })
}

/**
 * PUT /me with some fields changed (the language from the user menu, the codes' channel): the
 * rest of the profile is read from the server just before, not taken from this tab's /me, which
 * a tab opened earlier keeps for five minutes and would put back (B100). Nothing is sent when the
 * server holds these values already.
 */
export function useUpdateProfileFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (changes: Partial<MeUpdateDto>) => {
      const current = await queryClient.fetchQuery({
        queryKey: sessionKeys.me,
        queryFn: ({ signal }) => meApi.get(signal),
        staleTime: 0,
      })
      const profile = profileOf(current)
      const changed = (Object.keys(changes) as (keyof MeUpdateDto)[]).some(
        (key) => changes[key] !== profile[key],
      )
      return changed ? meApi.update({ ...profile, ...changes }) : current
    },
    onSuccess: (me) => queryClient.setQueryData(sessionKeys.me, me),
  })
}

/** PUT /me/password: the current password, then the new one. */
export function useChangePassword() {
  return useMutation({
    mutationFn: meApi.changePassword,
  })
}
