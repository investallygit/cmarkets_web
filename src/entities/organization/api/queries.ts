import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, isApiError } from '@/shared/api'
import type {
  MemberInviteDto,
  MemberUpdateDto,
  OrganizationDto,
  OrganizationMemberDto,
} from '@/shared/api/contracts'

export const organizationKeys = {
  all: ['organization'] as const,
  current: () => [...organizationKeys.all, 'current'] as const,
  members: () => [...organizationKeys.all, 'members'] as const,
}

/** GET /organization: null for an individual account (a 404), not asked when /me says so. */
export function useOrganization(enabled = true) {
  return useQuery({
    queryKey: organizationKeys.current(),
    queryFn: async ({ signal }) => {
      try {
        return await apiClient.get<OrganizationDto>('/organization', { signal })
      } catch (error) {
        if (isApiError(error, 404)) return null
        throw error
      }
    },
    enabled,
  })
}

/** GET /organization/members: the members, then the invitations not yet accepted. */
export function useMembers(enabled: boolean) {
  return useQuery({
    queryKey: organizationKeys.members(),
    queryFn: ({ signal }) =>
      apiClient.get<OrganizationMemberDto[]>('/organization/members', { signal }),
    enabled,
  })
}

/** After a change of the members: the list, and the count of the organisation. */
function useRefresh() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: organizationKeys.all })
}

/** POST /organization/members: an invitation by e-mail. */
export function useInviteMember() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (invite: MemberInviteDto) =>
      apiClient.post<OrganizationMemberDto>('/organization/members', invite),
    onSuccess: refresh,
  })
}

/** PUT /organization/members/{userId}: administrator or member. */
export function useUpdateMember() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: MemberUpdateDto }) =>
      apiClient.put<OrganizationMemberDto>(
        `/organization/members/${encodeURIComponent(id)}`,
        update,
      ),
    onSuccess: refresh,
  })
}

/** DELETE /organization/members/{userId}: a member leaves, or an invitation is withdrawn. */
export function useRemoveMember() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/organization/members/${encodeURIComponent(id)}`),
    onSuccess: refresh,
  })
}
