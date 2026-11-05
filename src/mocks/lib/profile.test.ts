import { describe, expect, it } from 'vitest'
import type { MyProfileUpdateDto } from '@/shared/api/contracts'
import { DEFAULT_CONTACT_RULES } from './contact'
import { readExperience, readPrivacy, readProfile } from './profile'

// The checks of the professional profile, spec section 15.
const SPECIALTIES = new Set(['sovereign-bonds', 'cemac-equities', 'banks'])

const profile: MyProfileUpdateDto = {
  displayName: 'K. Atangana',
  jobTitle: 'CEMAC equity & sovereign analyst',
  organization: 'Independent',
  city: 'Douala',
  country: 'CM',
  languages: ['fr', 'en'],
  about: 'Twelve years of analysis on Central African markets.',
  specialties: ['sovereign-bonds', 'cemac-equities'],
  contact: { workEmail: 'k.atangana@analyst.example', phone: null, linkedIn: 'linkedin.com/in/ka' },
}

describe('profile checks', () => {
  it('take a full profile, and read empty contact details as none', () => {
    const contact = { workEmail: ' ', phone: '', linkedIn: null }
    const read = readProfile({ ...profile, contact }, SPECIALTIES)
    expect(read.errors).toEqual({})
    expect(read.profile.contact).toEqual({ workEmail: null, phone: null, linkedIn: null })
  })

  it('need the name, job, organisation, city, country and a language', () => {
    const empty = { ...profile, jobTitle: ' ', city: '', country: 'Cameroon', languages: [] }
    expect(Object.keys(readProfile(empty, SPECIALTIES).errors).sort()).toEqual([
      'city',
      'country',
      'jobTitle',
      'languages',
    ])
  })

  it('keep the about to 600 characters and the specialties to 8 of the list', () => {
    const long = { ...profile, about: 'x'.repeat(601), specialties: ['banks', 'astrology'] }
    expect(Object.keys(readProfile(long, SPECIALTIES).errors).sort()).toEqual([
      'about',
      'specialties',
    ])
    const nine = { ...profile, specialties: Array.from({ length: 9 }, () => 'banks') }
    expect(readProfile(nine, SPECIALTIES).errors.specialties).toBeDefined()
  })

  it('check the e-mail, the phone and the LinkedIn address', () => {
    const contact = { workEmail: 'k.atangana', phone: '12', linkedIn: 'facebook.com/ka' }
    expect(Object.keys(readProfile({ ...profile, contact }, SPECIALTIES).errors).sort()).toEqual([
      'contact.linkedIn',
      'contact.phone',
      'contact.workEmail',
    ])
  })

  it('want a mode for each client type and the four switches', () => {
    const privacy = {
      visibility: 'members',
      contactRules: DEFAULT_CONTACT_RULES,
      show: { email: false, phone: false, onlineStatus: true, publicationStats: true },
    } as const
    expect(readPrivacy(privacy)).toEqual({ errors: {}, privacy })
    const wrong = readPrivacy({
      visibility: 'friends' as 'hidden',
      contactRules: { ...DEFAULT_CONTACT_RULES, ceo: 'maybe' as 'none' },
      show: { ...privacy.show, phone: 'yes' as unknown as boolean },
    })
    expect(Object.keys(wrong.errors).sort()).toEqual([
      'contactRules.ceo',
      'show.phone',
      'visibility',
    ])
  })

  it('take a position from a year to this day, and a certification without an end', () => {
    const position = { kind: 'position', title: 'Credit analyst', organization: 'Bank H' } as const
    expect(readExperience({ ...position, from: 2014, to: 2020 }, 2026).errors).toEqual({})
    expect(readExperience({ ...position, from: 2020, to: null }, 2026).errors).toEqual({})
    expect(Object.keys(readExperience({ ...position, from: 2021, to: 2019 }, 2026).errors)).toEqual(
      ['to'],
    )
    expect(Object.keys(readExperience({ ...position, from: 2030, to: null }, 2026).errors)).toEqual(
      ['from'],
    )
    const certification = { kind: 'certification', title: 'CFA Charterholder' } as const
    expect(readExperience({ ...certification, organization: '', from: null }, 2026).errors).toEqual(
      {},
    )
    expect(
      Object.keys(readExperience({ ...certification, from: 2017, to: 2018 }, 2026).errors),
    ).toEqual(['to'])
  })
})
