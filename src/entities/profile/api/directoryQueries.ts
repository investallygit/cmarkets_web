import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  BlockedUserDto,
  ContactPermissionDto,
  DirectoryEntryDto,
  DirectoryFacetsDto,
  DirectoryQuery,
  Paged,
  ProfileDto,
  ProfileReportDto,
  PublicProfileDto,
} from '@/shared/api/contracts'
import { profileKeys } from './queries'

const profilePath = (userId: string) => `/profiles/${encodeURIComponent(userId)}`

/** GET /directory: a page of cards; the page before stays on screen while the next one loads. */
export function useDirectory(query: DirectoryQuery) {
  const { types, contactable, recent, ...filters } = query
  return useQuery({
    queryKey: profileKeys.directory(query),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<DirectoryEntryDto>>('/directory', {
        query: {
          ...filters,
          types: types?.join(','),
          contactable: contactable || undefined,
          recent: recent || undefined,
        },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}

/** GET /directory/facets: the counts of the whole directory, by type, country, specialty... */
export function useDirectoryFacets() {
  return useQuery({
    queryKey: profileKeys.facets(),
    queryFn: ({ signal }) => apiClient.get<DirectoryFacetsDto>('/directory/facets', { signal }),
  })
}

/** GET /profiles/{userId}: the profile as its owner lets the user see it. */
export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: profileKeys.detail(userId ?? ''),
    queryFn: ({ signal }) => apiClient.get<ProfileDto>(profilePath(userId ?? ''), { signal }),
    enabled: Boolean(userId),
  })
}

/** GET /profiles/{userId}/contact-permission: Contact, Send a request, or Contact not open. */
export function useContactPermission(userId: string | null) {
  return useQuery({
    queryKey: profileKeys.contactPermission(userId ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<ContactPermissionDto>(`${profilePath(userId ?? '')}/contact-permission`, {
        signal,
      }),
    enabled: Boolean(userId),
  })
}

/** GET /public/profiles/{slug}: a public profile, read without login. */
export function usePublicProfile(handle: string) {
  return useQuery({
    queryKey: profileKeys.publicProfile(handle),
    queryFn: ({ signal }) =>
      apiClient.get<PublicProfileDto>(`/public/profiles/${encodeURIComponent(handle)}`, {
        signal,
      }),
  })
}

/** POST /profiles/{userId}/report */
export function useReportProfile(userId: string) {
  return useMutation({
    mutationFn: (report: ProfileReportDto) =>
      apiClient.post<void>(`${profilePath(userId)}/report`, report),
  })
}

/** GET /me/blocks: the people the user blocked. */
export function useBlocks() {
  return useQuery({
    queryKey: profileKeys.blocks(),
    queryFn: ({ signal }) => apiClient.get<BlockedUserDto[]>('/me/blocks', { signal }),
  })
}

/** POST / DELETE /blocks/{userId}: the directory and the profiles change with it. */
export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, block }: { userId: string; block: boolean }) => {
      const blockPath = `/blocks/${encodeURIComponent(userId)}`
      return block ? apiClient.post<void>(blockPath) : apiClient.delete<void>(blockPath)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.blocks() })
      void queryClient.invalidateQueries({ queryKey: profileKeys.listed() })
    },
  })
}
