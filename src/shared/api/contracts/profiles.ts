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
