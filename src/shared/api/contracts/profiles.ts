import type { IsoDateTime } from './common'
import type { AccountType, ClientAccountType, UserLanguage } from './me'

/**
 * Who sees a profile (spec section 15): nobody in the directory, the users logged in (the
 * default), or also anyone, on the public page /p/{handle}.
 */
export type ProfileVisibility = 'hidden' | 'members' | 'public'

/**
 * How a sender of a given type reaches the user: a conversation at once, a request the user
 * accepts first, or "Contact not open".
 */
export type ContactMode = 'direct' | 'request' | 'none'

/** The mode of each of the six client types, which the user chooses. */
export type ContactRules = Record<ClientAccountType, ContactMode>

/** A position held, or a certification obtained. */
export type ExperienceKind = 'position' | 'certification'

/** POST /me/profile/experiences returns the ExperienceDto created, PUT .../{id} the one changed. */
export interface ExperienceInputDto {
  kind: ExperienceKind
  title: string
  /** The employer, or the body that awards the certification; may be empty for a certification. */
  organization: string
  /** Year the position started, or the certification was obtained. */
  from: number | null
  /** Year the position ended; null: to this day. Always null for a certification. */
  to: number | null
}

export interface ExperienceDto extends ExperienceInputDto {
  id: string
}

/** Contact details: hidden unless the user shows them (ProfilePrivacyDto.show). */
export interface ProfileContactDto {
  workEmail: string | null
  phone: string | null
  /** The address of the LinkedIn profile, "linkedin.com/in/...". */
  linkedIn: string | null
}

/** An Analyst's figures on CMarket, computed by the server (spec section 15). */
export interface ProfileStatsDto {
  publications: number
  /** Readers' average score out of 5; null before any score. */
  rating: number | null
  followers: number
}

/** PUT /me/profile: the type, its badge and the statistics are CMarket's, not the user's. */
export interface MyProfileUpdateDto {
  /** The account's display name, the one CFG changes too. */
  displayName: string
  jobTitle: string
  organization: string
  city: string
  /** ISO 3166 alpha-2, e.g. "CM". */
  country: string
  /** ISO 639-1 codes of the languages spoken, at least one. */
  languages: string[]
  /** 600 characters at most. */
  about: string
  /** Ids of GET /directory/specialties, 8 at most. */
  specialties: string[]
  contact: ProfileContactDto
}

/** GET /me/profile (spec section 15, screen 12). */
export interface MyProfileDto extends MyProfileUpdateDto {
  userId: string
  /** The address of the public page, /p/{handle}. */
  handle: string
  accountType: AccountType
  /** An Admin approved the status: the green VERIFIED badge. */
  verified: boolean
  /** JPEG cropped square; null: the initials on a dark background. */
  photoUrl: string | null
  experiences: ExperienceDto[]
  /** An Analyst's; null for the other types, whose card shows the year they joined. */
  stats: ProfileStatsDto | null
  memberSince: IsoDateTime
  /** Last PUT; null before the first. */
  updatedAt: IsoDateTime | null
}

/** What the profile shows, besides the card. */
export interface ProfileDisplayDto {
  email: boolean
  phone: boolean
  onlineStatus: boolean
  /** An Analyst's publications, average score and followers. */
  publicationStats: boolean
}

/** GET / PUT /me/profile/privacy */
export interface ProfilePrivacyDto {
  visibility: ProfileVisibility
  /** Direct for every type but the Student's Request, by default; the Admin sets the defaults. */
  contactRules: ContactRules
  show: ProfileDisplayDto
}

/**
 * GET /directory/specialties: the closed list the Admin manages (spec section 15), named in both
 * languages. The spec names no endpoint for it: the prototype's.
 */
export interface SpecialtyDto {
  id: string
  name: Record<UserLanguage, string>
}

/** Order of GET /directory: the best match first, by name, or the newest members first. */
export type DirectorySort = 'relevance' | 'name' | 'recent'

/**
 * GET /directory?q=&types=&country=&specialty=&org=&language=&contactable=&page= (spec section
 * 10). `recent` and `sort` are the prototype's, for the screen 10 mockup.
 */
export interface DirectoryQuery {
  /** Name, organisation, job title or specialty, without accents or case. */
  q?: string
  /** None: the six types. */
  types?: ClientAccountType[]
  country?: string
  /** An id of GET /directory/specialties. */
  specialty?: string
  /** The organisation as the profiles write it. */
  org?: string
  language?: string
  /** Only the profiles the user may write to, at once or by a request. */
  contactable?: boolean
  /** Only the Analysts who published in the last 90 days. */
  recent?: boolean
  sort?: DirectorySort
  page?: number
  pageSize?: number
}

/** A card of the directory (spec section 9, screen 10). */
export interface DirectoryEntryDto {
  userId: string
  handle: string
  displayName: string
  accountType: ClientAccountType
  verified: boolean
  photoUrl: string | null
  jobTitle: string
  organization: string
  city: string
  country: string
  /** Ids of GET /directory/specialties. */
  specialties: string[]
  /** An Analyst's, unless they hide them. */
  stats: ProfileStatsDto | null
  memberSince: IsoDateTime
  /**
   * The button the user sees, as GET /profiles/{id}/contact-permission would answer: the
   * prototype gives it with each card rather than one call per card.
   */
  contactMode: ContactMode
}

/** How many listed profiles have a value. */
export interface FacetCountDto {
  value: string
  count: number
}

/** GET /directory/facets: the counts of the whole directory, whatever the filters. */
export interface DirectoryFacetsDto {
  total: number
  types: Record<ClientAccountType, number>
  /** ISO codes. */
  countries: FacetCountDto[]
  /** Ids of GET /directory/specialties. */
  specialties: FacetCountDto[]
  /** The prototype's, for the lists of the Organisation and Language filters. */
  organizations: FacetCountDto[]
  /** ISO 639-1 codes. */
  languages: FacetCountDto[]
}

/** GET /public/profiles/{slug}: what anyone sees of a public profile, without login. */
export interface PublicProfileDto {
  userId: string
  handle: string
  displayName: string
  accountType: ClientAccountType
  verified: boolean
  photoUrl: string | null
  jobTitle: string
  organization: string
  city: string
  country: string
  languages: string[]
  about: string
  specialties: string[]
  experiences: ExperienceDto[]
  stats: ProfileStatsDto | null
  memberSince: IsoDateTime
  /** An Analyst's id in the research library (/library?analystId=); null for the others. */
  analystId: string | null
}

/** GET /profiles/{userId}: the profile as its visibility and display settings let the user see it. */
export interface ProfileDto extends PublicProfileDto {
  /** Only what the user shows: hidden details are null. */
  contact: ProfileContactDto
  /** Who may write, by type: "Accepts messages from…". */
  contactRules: ContactRules
}

/** GET /profiles/{userId}/contact-permission */
export interface ContactPermissionDto {
  mode: ContactMode
}

export type ProfileReportReason = 'fake' | 'spam' | 'inappropriate' | 'harassment' | 'other'

/** POST /profiles/{userId}/report: the Admin reviews it (spec section 15). */
export interface ProfileReportDto {
  reason: ProfileReportReason
  comment: string
}
