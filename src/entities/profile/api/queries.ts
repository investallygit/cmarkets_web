import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  DirectoryQuery,
  ExperienceDto,
  ExperienceInputDto,
  MyProfileDto,
  MyProfileUpdateDto,
  ProfilePrivacyDto,
  SpecialtyDto,
} from '@/shared/api/contracts'

export const profileKeys = {
  all: ['profiles'] as const,
  mine: () => [...profileKeys.all, 'me'] as const,
  privacy: () => [...profileKeys.all, 'me', 'privacy'] as const,
  specialties: () => [...profileKeys.all, 'specialties'] as const,
  blocks: () => [...profileKeys.all, 'me', 'blocks'] as const,
  /** What the directory shows, the user's own card included: refreshed when it changes. */
  listed: () => [...profileKeys.all, 'listed'] as const,
  directory: (query: DirectoryQuery) => [...profileKeys.listed(), 'search', query] as const,
  facets: () => [...profileKeys.listed(), 'facets'] as const,
  detail: (userId: string) => [...profileKeys.listed(), 'detail', userId] as const,
  contactPermission: (userId: string) => [...profileKeys.listed(), 'contact', userId] as const,
  publicProfile: (handle: string) => [...profileKeys.listed(), 'public', handle] as const,
}

const experiencePath = (id: string) => `/me/profile/experiences/${encodeURIComponent(id)}`

/** GET /me/profile: the user's professional profile (screen 12). */
export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.mine(),
    queryFn: ({ signal }) => apiClient.get<MyProfileDto>('/me/profile', { signal }),
  })
}

/** GET /me/profile/privacy: visibility, who may write, what the profile shows. */
export function useMyPrivacy() {
  return useQuery({
    queryKey: profileKeys.privacy(),
    queryFn: ({ signal }) => apiClient.get<ProfilePrivacyDto>('/me/profile/privacy', { signal }),
  })
}

/** GET /directory/specialties: the Admin's closed list, which changes little. */
export function useSpecialties() {
  return useQuery({
    queryKey: profileKeys.specialties(),
    queryFn: ({ signal }) => apiClient.get<SpecialtyDto[]>('/directory/specialties', { signal }),
    staleTime: Infinity,
  })
}

/**
 * Puts the profile the server returned in the cache, so every panel shows it at once; the
 * directory shows it on its next visit.
 */
function useSetMyProfile() {
  const queryClient = useQueryClient()
  return (profile: MyProfileDto) => {
    queryClient.setQueryData(profileKeys.mine(), profile)
    void queryClient.invalidateQueries({ queryKey: profileKeys.listed() })
  }
}

/** PUT /me/profile */
export function useUpdateMyProfile() {
  const setProfile = useSetMyProfile()
  return useMutation({
    mutationFn: (input: MyProfileUpdateDto) => apiClient.put<MyProfileDto>('/me/profile', input),
    onSuccess: setProfile,
  })
}

/** POST /me/profile/photo: a JPEG or PNG of 2 MB at most, which the server crops square. */
export function useUploadProfilePhoto() {
  const setProfile = useSetMyProfile()
  return useMutation({
    mutationFn: (photo: File) => {
      const form = new FormData()
      form.append('photo', photo)
      return apiClient.postForm<MyProfileDto>('/me/profile/photo', form)
    },
    onSuccess: setProfile,
  })
}

/** PUT /me/profile/privacy */
export function useUpdateMyPrivacy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfilePrivacyDto) =>
      apiClient.put<ProfilePrivacyDto>('/me/profile/privacy', input),
    onSuccess: (privacy) => {
      queryClient.setQueryData(profileKeys.privacy(), privacy)
      void queryClient.invalidateQueries({ queryKey: profileKeys.listed() })
    },
  })
}

/** Writes an experience the server returned into the cached profile, then refetches it. */
function useUpdateExperiences() {
  const queryClient = useQueryClient()
  return (update: (experiences: ExperienceDto[]) => ExperienceDto[]) => {
    queryClient.setQueryData<MyProfileDto>(
      profileKeys.mine(),
      (profile) => profile && { ...profile, experiences: update(profile.experiences) },
    )
    void queryClient.invalidateQueries({ queryKey: profileKeys.mine() })
    void queryClient.invalidateQueries({ queryKey: profileKeys.listed() })
  }
}

/** POST /me/profile/experiences, or PUT .../{id} with an id. */
export function useSaveExperience() {
  const updateExperiences = useUpdateExperiences()
  return useMutation({
    mutationFn: ({ id, ...input }: ExperienceInputDto & { id?: string }) =>
      id
        ? apiClient.put<ExperienceDto>(experiencePath(id), input)
        : apiClient.post<ExperienceDto>('/me/profile/experiences', input),
    onSuccess: (saved) =>
      updateExperiences((experiences) =>
        experiences.some((experience) => experience.id === saved.id)
          ? experiences.map((experience) => (experience.id === saved.id ? saved : experience))
          : [...experiences, saved],
      ),
  })
}

export function useDeleteExperience() {
  const updateExperiences = useUpdateExperiences()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(experiencePath(id)),
    onSuccess: (_result, id) =>
      updateExperiences((experiences) => experiences.filter((experience) => experience.id !== id)),
  })
}
