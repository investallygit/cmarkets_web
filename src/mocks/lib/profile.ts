import {
  CLIENT_ACCOUNT_TYPES,
  type ContactMode,
  type ContactRules,
  type ExperienceInputDto,
  type MyProfileUpdateDto,
  type ProfilePrivacyDto,
  type ProfileVisibility,
} from '@/shared/api/contracts'
import { isPhoneNumber } from '@/shared/lib/phone'

/**
 * The checks of a profile, its privacy and its experiences, as the server runs them before saving
 * (spec section 15); errors by field, as FluentValidation reports them.
 */

export type Errors = Record<string, string[]>

export const NAME_MAX = 80
export const ABOUT_MAX = 600
export const SPECIALTIES_MAX = 8
const TEXT_MAX = 80
const LANGUAGES_MAX = 10

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LINKEDIN = /^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/(in|pub)\/[\w%.-]+\/?$/i

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
/** An optional field: null when empty. */
const optional = (value: unknown) => text(value) || null

/** PUT /me/profile: the fields the user writes, the specialties from the Admin's list. */
export function readProfile(
  body: Partial<MyProfileUpdateDto>,
  specialtyIds: ReadonlySet<string>,
): { errors: Errors; profile: MyProfileUpdateDto } {
  const errors: Errors = {}
  const required = (field: keyof MyProfileUpdateDto, max: number) => {
    const value = text(body[field])
    if (!value) errors[field] = ['Required.']
    else if (value.length > max) errors[field] = [`At most ${max} characters.`]
    return value
  }
  const displayName = required('displayName', NAME_MAX)
  const jobTitle = required('jobTitle', TEXT_MAX)
  const organization = required('organization', TEXT_MAX)
  const city = required('city', TEXT_MAX)
  const country = text(body.country).toUpperCase()
  if (!/^[A-Z]{2}$/.test(country)) errors.country = ['An ISO country code, e.g. CM.']
  const languages = Array.isArray(body.languages) ? body.languages.map(text) : []
  if (
    languages.length === 0 ||
    languages.length > LANGUAGES_MAX ||
    new Set(languages).size !== languages.length ||
    !languages.every((code) => /^[a-z]{2,3}$/.test(code))
  ) {
    errors.languages = [`From 1 to ${LANGUAGES_MAX} languages, as ISO codes, each once.`]
  }
  const about = typeof body.about === 'string' ? body.about.trim() : ''
  if (about.length > ABOUT_MAX) errors.about = [`At most ${ABOUT_MAX} characters.`]
  const specialties = Array.isArray(body.specialties) ? body.specialties.map(text) : []
  if (
    specialties.length > SPECIALTIES_MAX ||
    new Set(specialties).size !== specialties.length ||
    !specialties.every((id) => specialtyIds.has(id))
  ) {
    errors.specialties = [`Up to ${SPECIALTIES_MAX} specialties of the list, each once.`]
  }
  const contact = body.contact ?? { workEmail: null, phone: null, linkedIn: null }
  const workEmail = optional(contact.workEmail)
  if (workEmail && !EMAIL.test(workEmail)) errors['contact.workEmail'] = ['An e-mail address.']
  const phone = optional(contact.phone)
  if (phone && !isPhoneNumber(phone)) {
    errors['contact.phone'] = ['A phone number, e.g. +237 6 70 12 34 56.']
  }
  const linkedIn = optional(contact.linkedIn)
  if (linkedIn && !LINKEDIN.test(linkedIn)) {
    errors['contact.linkedIn'] = ['The address of a LinkedIn profile: linkedin.com/in/...']
  }
  return {
    errors,
    profile: {
      displayName,
      jobTitle,
      organization,
      city,
      country,
      languages,
      about,
      specialties,
      contact: { workEmail, phone, linkedIn },
    },
  }
}

const VISIBILITIES: readonly ProfileVisibility[] = ['hidden', 'members', 'public']
const MODES: readonly ContactMode[] = ['direct', 'request', 'none']
const SHOWN = ['email', 'phone', 'onlineStatus', 'publicationStats'] as const

/** PUT /me/profile/privacy: the visibility, a mode for each client type, four switches. */
export function readPrivacy(body: Partial<ProfilePrivacyDto>): {
  errors: Errors
  privacy: ProfilePrivacyDto
} {
  const errors: Errors = {}
  const visibility = VISIBILITIES.find((candidate) => candidate === body.visibility)
  if (!visibility) errors.visibility = ['hidden, members or public.']
  const contactRules = {} as ContactRules
  for (const type of CLIENT_ACCOUNT_TYPES) {
    const mode = MODES.find((candidate) => candidate === body.contactRules?.[type])
    if (!mode) errors[`contactRules.${type}`] = ['direct, request or none.']
    contactRules[type] = mode ?? 'none'
  }
  const show = {} as ProfilePrivacyDto['show']
  for (const key of SHOWN) {
    const value = body.show?.[key]
    if (typeof value !== 'boolean') errors[`show.${key}`] = ['true or false.']
    show[key] = value === true
  }
  return { errors, privacy: { visibility: visibility ?? 'members', contactRules, show } }
}

export const EXPERIENCES_MAX = 20
const FIRST_YEAR = 1950

/**
 * POST and PUT /me/profile/experiences: a position has its years, from when to when or to this
 * day, and its employer if any; a certification its title, and its year if given.
 */
export function readExperience(
  body: Partial<ExperienceInputDto>,
  thisYear: number,
): { errors: Errors; experience: ExperienceInputDto } {
  const errors: Errors = {}
  const kind = body.kind === 'position' || body.kind === 'certification' ? body.kind : null
  if (!kind) errors.kind = ['position or certification.']
  const title = text(body.title)
  if (!title || title.length > TEXT_MAX) errors.title = [`From 1 to ${TEXT_MAX} characters.`]
  const organization = text(body.organization)
  if (organization.length > TEXT_MAX) errors.organization = [`At most ${TEXT_MAX} characters.`]
  const year = (value: unknown) =>
    Number.isInteger(value) && Number(value) >= FIRST_YEAR && Number(value) <= thisYear
      ? Number(value)
      : null
  const from = body.from == null ? null : year(body.from)
  if (body.from != null && from === null) errors.from = [`A year from ${FIRST_YEAR} to now.`]
  else if (kind === 'position' && from === null) errors.from = ['Required.']
  const to = body.to == null ? null : year(body.to)
  if (body.to != null && (to === null || (from !== null && to < from))) {
    errors.to = ['A year from the start to now.']
  } else if (kind === 'certification' && to !== null) {
    errors.to = ['A certification has no end.']
  }
  return { errors, experience: { kind: kind ?? 'position', title, organization, from, to } }
}
