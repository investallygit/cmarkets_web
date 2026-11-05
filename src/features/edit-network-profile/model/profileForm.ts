import { ABOUT_MAX_LENGTH } from '@/entities/profile'
import { isEmailAddress } from '@/entities/session'
import type {
  ContactRules,
  MyProfileDto,
  MyProfileUpdateDto,
  ProfileDisplayDto,
  ProfilePrivacyDto,
  ProfileVisibility,
} from '@/shared/api/contracts'
import { isPhoneNumber } from '@/shared/lib/phone'

/** Name, job, organisation and city, as the server takes them. */
export const TEXT_MAX_LENGTH = 80

const LINKEDIN = /^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/(in|pub)\/[\w%.-]+\/?$/i

/** The two forms of NET ME, the profile and its privacy, saved by one button. */
export interface ProfileFormState {
  displayName: string
  jobTitle: string
  organization: string
  city: string
  country: string
  languages: string[]
  about: string
  specialties: string[]
  workEmail: string
  phone: string
  linkedIn: string
  visibility: ProfileVisibility
  contactRules: ContactRules
  show: ProfileDisplayDto
}

export type ProfileFormError = 'required' | 'tooLong' | 'email' | 'phone' | 'linkedIn'
export type ProfileFormErrors = Partial<Record<keyof ProfileFormState, ProfileFormError>>

export function initialProfileForm(
  profile: MyProfileDto,
  privacy: ProfilePrivacyDto,
): ProfileFormState {
  return {
    displayName: profile.displayName,
    jobTitle: profile.jobTitle,
    organization: profile.organization,
    city: profile.city,
    country: profile.country,
    languages: [...profile.languages],
    about: profile.about,
    specialties: [...profile.specialties],
    workEmail: profile.contact.workEmail ?? '',
    phone: profile.contact.phone ?? '',
    linkedIn: profile.contact.linkedIn ?? '',
    visibility: privacy.visibility,
    contactRules: { ...privacy.contactRules },
    show: { ...privacy.show },
  }
}

/** The checks the server makes, so a save is not sent to be refused. */
export function validateProfileForm(form: ProfileFormState): ProfileFormErrors {
  const errors: ProfileFormErrors = {}
  for (const field of ['displayName', 'jobTitle', 'organization', 'city'] as const) {
    const value = form[field].trim()
    if (!value) errors[field] = 'required'
    else if (value.length > TEXT_MAX_LENGTH) errors[field] = 'tooLong'
  }
  if (!form.country) errors.country = 'required'
  if (form.languages.length === 0) errors.languages = 'required'
  if (form.about.trim().length > ABOUT_MAX_LENGTH) errors.about = 'tooLong'
  if (form.workEmail.trim() && !isEmailAddress(form.workEmail)) errors.workEmail = 'email'
  if (form.phone.trim() && !isPhoneNumber(form.phone)) errors.phone = 'phone'
  if (form.linkedIn.trim() && !LINKEDIN.test(form.linkedIn.trim())) errors.linkedIn = 'linkedIn'
  return errors
}

export function hasErrors(errors: ProfileFormErrors): boolean {
  return Object.keys(errors).length > 0
}

/** PUT /me/profile; empty contact details are none. */
export function toProfileUpdate(form: ProfileFormState): MyProfileUpdateDto {
  return {
    displayName: form.displayName.trim(),
    jobTitle: form.jobTitle.trim(),
    organization: form.organization.trim(),
    city: form.city.trim(),
    country: form.country,
    languages: [...form.languages],
    about: form.about.trim(),
    specialties: [...form.specialties],
    contact: {
      workEmail: form.workEmail.trim() || null,
      phone: form.phone.trim() || null,
      linkedIn: form.linkedIn.trim() || null,
    },
  }
}

/** PUT /me/profile/privacy */
export function toPrivacy(form: ProfileFormState): ProfilePrivacyDto {
  return {
    visibility: form.visibility,
    contactRules: { ...form.contactRules },
    show: { ...form.show },
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Which of the two the user changed: only those are sent. */
export function changesOf(
  form: ProfileFormState,
  saved: { profile: MyProfileDto; privacy: ProfilePrivacyDto },
): { profile: boolean; privacy: boolean } {
  const initial = initialProfileForm(saved.profile, saved.privacy)
  return {
    profile: !same(toProfileUpdate(form), toProfileUpdate(initial)),
    privacy: !same(toPrivacy(form), toPrivacy(initial)),
  }
}

/** The field of the form a server error is about: "contact.workEmail" is the work e-mail. */
export function formFieldOf(serverField: string): keyof ProfileFormState | null {
  const [head, tail] = serverField.split('.')
  if (head === 'contact') {
    return tail === 'workEmail' || tail === 'phone' || tail === 'linkedIn' ? tail : null
  }
  const fields: readonly string[] = [
    'displayName',
    'jobTitle',
    'organization',
    'city',
    'country',
    'languages',
    'about',
    'specialties',
    'visibility',
    'contactRules',
    'show',
  ]
  return fields.includes(head) ? (head as keyof ProfileFormState) : null
}
