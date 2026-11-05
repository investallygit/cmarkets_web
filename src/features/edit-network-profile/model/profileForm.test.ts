import { describe, expect, it } from 'vitest'
import type { MyProfileDto, ProfilePrivacyDto } from '@/shared/api/contracts'
import {
  changesOf,
  formFieldOf,
  initialProfileForm,
  toPrivacy,
  toProfileUpdate,
  validateProfileForm,
} from './profileForm'

const profile: MyProfileDto = {
  userId: 'user-analyst',
  handle: 'k-atangana',
  displayName: 'K. Atangana',
  accountType: 'analyst',
  verified: true,
  photoUrl: null,
  jobTitle: 'CEMAC equity & sovereign analyst',
  organization: 'Independent',
  city: 'Douala',
  country: 'CM',
  languages: ['fr', 'en'],
  about: 'Twelve years of analysis on Central African markets.',
  specialties: ['sovereign-bonds'],
  experiences: [],
  contact: { workEmail: 'k.atangana@analyst.example', phone: null, linkedIn: null },
  stats: { publications: 42, rating: 4.4, followers: 412 },
  memberSince: '2024-11-04T10:30:00Z',
  updatedAt: null,
}

const privacy: ProfilePrivacyDto = {
  visibility: 'members',
  contactRules: {
    student: 'request',
    analyst: 'direct',
    manager: 'direct',
    trader: 'direct',
    journalist: 'direct',
    ceo: 'direct',
  },
  show: { email: false, phone: false, onlineStatus: true, publicationStats: true },
}

describe('the NET ME form', () => {
  const form = initialProfileForm(profile, privacy)

  it('starts from the profile and its privacy, and sends them back unchanged', () => {
    expect(validateProfileForm(form)).toEqual({})
    expect(toProfileUpdate(form)).toEqual({
      displayName: 'K. Atangana',
      jobTitle: 'CEMAC equity & sovereign analyst',
      organization: 'Independent',
      city: 'Douala',
      country: 'CM',
      languages: ['fr', 'en'],
      about: 'Twelve years of analysis on Central African markets.',
      specialties: ['sovereign-bonds'],
      contact: { workEmail: 'k.atangana@analyst.example', phone: null, linkedIn: null },
    })
    expect(toPrivacy(form)).toEqual(privacy)
    expect(changesOf(form, { profile, privacy })).toEqual({ profile: false, privacy: false })
  })

  it('says which of the profile and the privacy changed, blanks aside', () => {
    expect(changesOf({ ...form, jobTitle: ' Credit analyst ' }, { profile, privacy })).toEqual({
      profile: true,
      privacy: false,
    })
    expect(changesOf({ ...form, city: ' Douala ' }, { profile, privacy }).profile).toBe(false)
    const rules = { ...form.contactRules, student: 'none' } as const
    expect(changesOf({ ...form, contactRules: rules }, { profile, privacy })).toEqual({
      profile: false,
      privacy: true,
    })
  })

  it('needs the name, job, organisation, city, a language, and an about of 600 at most', () => {
    const empty = { ...form, jobTitle: ' ', city: '', languages: [], about: 'x'.repeat(601) }
    expect(validateProfileForm(empty)).toEqual({
      jobTitle: 'required',
      city: 'required',
      languages: 'required',
      about: 'tooLong',
    })
  })

  it('checks the contact details only when given', () => {
    const wrong = { ...form, workEmail: 'k.atangana', phone: '12', linkedIn: 'x.com/ka' }
    expect(validateProfileForm(wrong)).toEqual({
      workEmail: 'email',
      phone: 'phone',
      linkedIn: 'linkedIn',
    })
    const blank = { ...form, workEmail: ' ', linkedIn: 'linkedin.com/in/k-atangana' }
    expect(validateProfileForm(blank)).toEqual({})
    expect(toProfileUpdate(blank).contact.workEmail).toBeNull()
  })

  it("finds the field of a server's error", () => {
    expect(formFieldOf('contact.workEmail')).toBe('workEmail')
    expect(formFieldOf('jobTitle')).toBe('jobTitle')
    expect(formFieldOf('contactRules.ceo')).toBe('contactRules')
    expect(formFieldOf('photo')).toBeNull()
  })
})
