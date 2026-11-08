import type {
  BlockedUserDto,
  ContactPermissionDto,
  DirectoryEntryDto,
  DirectoryFacetsDto,
  DirectoryQuery,
  ExperienceDto,
  ExperienceInputDto,
  MyProfileDto,
  MyProfileUpdateDto,
  Paged,
  ProfileDto,
  ProfilePrivacyDto,
  ProfileReportDto,
  PublicProfileDto,
  SpecialtyDto,
} from '../contracts'
import { answer, route, send, sendForm } from './define'

/**
 * CMarket.Api/Controllers/Network: the professional directory (spec section 15): the user's own
 * profile, the directory and its facets, the profiles others see, reports and blocks.
 */
export const networkRoutes = {
  myProfile: route('GET', '/me/profile', answer<MyProfileDto>()),
  updateMyProfile: route('PUT', '/me/profile', answer<MyProfileDto>()),
  uploadPhoto: route('POST', '/me/profile/photo', answer<MyProfileDto>()),
  addExperience: route('POST', '/me/profile/experiences', answer<ExperienceDto>()),
  updateExperience: route('PUT', '/me/profile/experiences/{id}', answer<ExperienceDto>()),
  deleteExperience: route('DELETE', '/me/profile/experiences/{id}'),
  privacy: route('GET', '/me/profile/privacy', answer<ProfilePrivacyDto>()),
  updatePrivacy: route('PUT', '/me/profile/privacy', answer<ProfilePrivacyDto>()),
  directory: route('GET', '/directory', answer<Paged<DirectoryEntryDto>>()),
  facets: route('GET', '/directory/facets', answer<DirectoryFacetsDto>()),
  specialties: route('GET', '/directory/specialties', answer<SpecialtyDto[]>()),
  profile: route('GET', '/profiles/{userId}', answer<ProfileDto>()),
  contactPermission: route(
    'GET',
    '/profiles/{userId}/contact-permission',
    answer<ContactPermissionDto>(),
  ),
  reportProfile: route('POST', '/profiles/{userId}/report'),
  publicProfile: route('GET', '/public/profiles/{slug}', answer<PublicProfileDto>()),
  blocks: route('GET', '/me/blocks', answer<BlockedUserDto[]>()),
  block: route('POST', '/blocks/{userId}'),
  unblock: route('DELETE', '/blocks/{userId}'),
}

const ofUser = (userId: string, signal?: AbortSignal) => ({ params: { userId }, signal })

export const networkApi = {
  /** The user's professional profile (screen 12). */
  myProfile: (signal?: AbortSignal) => send(networkRoutes.myProfile, { signal }),
  updateMyProfile: (input: MyProfileUpdateDto) =>
    send(networkRoutes.updateMyProfile, { body: input }),
  /** A JPEG or PNG of 2 MB at most, which the server crops square. */
  uploadPhoto: (photo: File) => {
    const form = new FormData()
    form.append('photo', photo)
    return sendForm(networkRoutes.uploadPhoto, form)
  },
  /** A new experience without an id, an edit with one. */
  saveExperience: (id: string | undefined, input: ExperienceInputDto) =>
    id
      ? send(networkRoutes.updateExperience, { params: { id }, body: input })
      : send(networkRoutes.addExperience, { body: input }),
  deleteExperience: (id: string) => send(networkRoutes.deleteExperience, { params: { id } }),
  /** Visibility, who may write, what the profile shows. */
  privacy: (signal?: AbortSignal) => send(networkRoutes.privacy, { signal }),
  updatePrivacy: (input: ProfilePrivacyDto) => send(networkRoutes.updatePrivacy, { body: input }),
  /** A page of cards. */
  directory: ({ types, contactable, recent, ...filters }: DirectoryQuery, signal?: AbortSignal) =>
    send(networkRoutes.directory, {
      query: {
        ...filters,
        types: types?.join(','),
        contactable: contactable || undefined,
        recent: recent || undefined,
      },
      signal,
    }),
  /** The counts of the whole directory, by type, country, specialty... */
  facets: (signal?: AbortSignal) => send(networkRoutes.facets, { signal }),
  /** The Admin's closed list, named in both languages. */
  specialties: (signal?: AbortSignal) => send(networkRoutes.specialties, { signal }),
  /** The profile as its owner lets the user see it. */
  profile: (userId: string, signal?: AbortSignal) =>
    send(networkRoutes.profile, ofUser(userId, signal)),
  /** Contact, Send a request, or Contact not open. */
  contactPermission: (userId: string, signal?: AbortSignal) =>
    send(networkRoutes.contactPermission, ofUser(userId, signal)),
  reportProfile: (userId: string, report: ProfileReportDto) =>
    send(networkRoutes.reportProfile, { params: { userId }, body: report }),
  /** A public profile, read without login. */
  publicProfile: (slug: string, signal?: AbortSignal) =>
    send(networkRoutes.publicProfile, { params: { slug }, signal }),
  /** The people the user blocked. */
  blocks: (signal?: AbortSignal) => send(networkRoutes.blocks, { signal }),
  block: (userId: string, block: boolean) =>
    send(block ? networkRoutes.block : networkRoutes.unblock, { params: { userId } }),
}
