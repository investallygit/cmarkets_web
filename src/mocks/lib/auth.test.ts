import { describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, DEMO_PASSWORD_HASH, DEMO_SALT } from '../fixtures/accounts'
import {
  hashPassword,
  isSchoolEmail,
  maskEmail,
  maskPhone,
  otpCode,
  passwordErrors,
  randomToken,
} from './auth'

describe('mock authentication', () => {
  it('keeps the hash of the demo password, not the password', async () => {
    expect(await hashPassword(DEMO_SALT, DEMO_PASSWORD)).toBe(DEMO_PASSWORD_HASH)
    expect(await hashPassword('other-salt', DEMO_PASSWORD)).not.toBe(DEMO_PASSWORD_HASH)
  })

  it('sends six-digit codes and unguessable tokens', () => {
    expect(otpCode()).toMatch(/^\d{6}$/)
    expect(randomToken()).toMatch(/^[0-9a-f]{48}$/)
    expect(randomToken()).not.toBe(randomToken())
  })

  it('masks where a code went', () => {
    expect(maskEmail('k.atangana@analyst.example')).toBe('k•••@analyst.example')
    expect(maskPhone('+241 06 12 34 56')).toBe('+241 ••• ••• 56')
    expect(maskPhone('06 12 34 56')).toBe('••• ••• 56')
  })

  it('knows a school address by its domain (spec section 12)', () => {
    expect(isSchoolEmail('s.mvondo@university.example')).toBe(true)
    expect(isSchoolEmail('a.ngo@univ-douala.cm')).toBe(true)
    expect(isSchoolEmail('j.doe@harvard.edu')).toBe(true)
    expect(isSchoolEmail('j.doe@ox.ac.uk')).toBe(true)
    expect(isSchoolEmail('t.bekale@bank.example')).toBe(false)
  })

  it('asks for 8 characters with a letter and a digit', () => {
    expect(passwordErrors('cmarket2026')).toEqual([])
    expect(passwordErrors('abc')).toHaveLength(2)
  })
})
