import type {
  ContactMode,
  DirectorySort,
  ProfileReportReason,
  ProfileVisibility,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'

/** The three levels of spec section 15, from the most private. */
export const PROFILE_VISIBILITIES: readonly ProfileVisibility[] = ['hidden', 'members', 'public']

/** In the order of the "Who can contact me" grid: Direct, Request, No. */
export const CONTACT_MODES: readonly ContactMode[] = ['direct', 'request', 'none']

/** Languages a profile may list, as ISO 639-1 codes: those of the region first. */
export const PROFILE_LANGUAGES = ['fr', 'en', 'es', 'pt', 'ar', 'ln', 'de', 'it', 'zh']

/** Countries a profile may give: the CEMAC first, then the other markets of its users. */
export const PROFILE_COUNTRIES: readonly string[] = [
  ...CEMAC_COUNTRIES,
  'NG',
  'CI',
  'SN',
  'MA',
  'ZA',
  'KE',
  'FR',
  'BE',
  'CH',
  'GB',
  'US',
  'CN',
]

export const ABOUT_MAX_LENGTH = 600
export const MAX_SPECIALTIES = 8

/** POST /me/profile/photo takes a JPEG or a PNG of 2 MB at most. */
export const PHOTO_TYPES = ['image/jpeg', 'image/png']
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024

/** The orders of the directory, its default first. */
export const DIRECTORY_SORTS: readonly DirectorySort[] = ['relevance', 'name', 'recent']

/** Cards of a page of the directory: ten rows of two. */
export const DIRECTORY_PAGE_SIZE = 20

export const PROFILE_REPORT_REASONS: readonly ProfileReportReason[] = [
  'fake',
  'spam',
  'inappropriate',
  'harassment',
  'other',
]

/** The comment of a report, as POST /profiles/{userId}/report takes it. */
export const REPORT_COMMENT_MAX_LENGTH = 1000
