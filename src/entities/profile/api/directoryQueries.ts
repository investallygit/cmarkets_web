import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DirectoryQuery, ProfileReportDto } from '@/shared/api/contracts'
import { networkApi } from '@/shared/api/endpoints'
import { profileKeys } from './queries'

/** GET /directory: a page of cards; the page before stays on screen while the next one loads. */
export function useDirectory(query: DirectoryQuery) {
  return useQuery({
    queryKey: profileKeys.directory(query),
    queryFn: ({ signal }) => networkApi.directory(query, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /directory/facets: the counts of the whole directory, by type, country, specialty... */
export function useDirectoryFacets() {
  return useQuery({
    queryKey: profileKeys.facets(),
    queryFn: ({ signal }) => networkApi.facets(signal),
  })
}

/** GET /profiles/{userId}: the profile as its owner lets the user see it. */
export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: profileKeys.detail(userId ?? ''),
    queryFn: ({ signal }) => networkApi.profile(userId ?? '', signal),
    enabled: Boolean(userId),
  })
}

/** GET /profiles/{userId}/contact-permission: Contact, Send a request, or Contact not open. */
export function useContactPermission(userId: string | null) {
  return useQuery({
    queryKey: profileKeys.contactPermission(userId ?? ''),
    queryFn: ({ signal }) => networkApi.contactPermission(userId ?? '', signal),
    enabled: Boolean(userId),
  })
}

/** GET /public/profiles/{slug}: a public profile, read without login. */
export function usePublicProfile(handle: string) {
  return useQuery({
    queryKey: profileKeys.publicProfile(handle),
    queryFn: ({ signal }) => networkApi.publicProfile(handle, signal),
  })
}

/** POST /profiles/{userId}/report */
export function useReportProfile(userId: string) {
  return useMutation({
    mutationFn: (report: ProfileReportDto) => networkApi.reportProfile(userId, report),
  })
}

/** GET /me/blocks: the people the user blocked. */
export function useBlocks() {
  return useQuery({
    queryKey: profileKeys.blocks(),
    queryFn: ({ signal }) => networkApi.blocks(signal),
  })
}

/** POST / DELETE /blocks/{userId}: the directory and the profiles change with it. */
export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, block }: { userId: string; block: boolean }) =>
      networkApi.block(userId, block),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.blocks() })
      void queryClient.invalidateQueries({ queryKey: profileKeys.listed() })
    },
  })
}
