import { beforeAll, describe, expect, it } from 'vitest'

type Db = typeof import('./db')

// The professional profiles of NET ME, screen 12.
describe('professional profiles', () => {
  let db: Db

  beforeAll(async () => {
    db = await import('./db')
  })

  const account = (id: string) => db.findAccount(id)!

  it('give K. Atangana the profile of the screen 12 mockup, figures from the library', () => {
    const profile = db.myProfileDto(account('user-analyst'))
    expect(profile).toMatchObject({
      handle: 'k-atangana',
      displayName: 'K. Atangana',
      accountType: 'analyst',
      verified: true,
      jobTitle: 'CEMAC equity & sovereign analyst',
      organization: 'Independent',
      city: 'Douala',
      country: 'CM',
      languages: ['fr', 'en'],
      specialties: ['sovereign-bonds', 'cemac-equities', 'agribusiness'],
    })
    expect(profile.experiences.map((experience) => experience.title)).toEqual([
      'Independent analyst',
      'Credit analyst',
      'CFA Charterholder',
    ])
    // The 42 notes K. Atangana published in the library of screen 8, scored 4.4; 412 followers.
    expect(profile.stats).toEqual({ publications: 42, rating: 4.4, followers: 412 })
  })

  it('start any other client from the account, with the default privacy', () => {
    const profile = db.profileOf(account('user-ngono'))
    expect(profile).toMatchObject({
      jobTitle: 'Portfolio manager',
      organization: 'Asset manager A',
      city: 'Douala',
      country: 'CM',
      privacy: {
        visibility: 'members',
        contactRules: { student: 'request', analyst: 'direct', ceo: 'direct' },
        show: { email: false, phone: false },
      },
    })
    expect(db.statsOf(account('user-ngono'))).toBeNull()
  })

  it('give a name another account took first a numbered address', () => {
    const accounts = db.accountStore.read()
    const namesake = { ...account('user-analyst'), id: 'user-namesake', createdAt: '2026-11-01' }
    accounts.push(namesake)
    expect(db.handleOf(account('user-analyst'))).toBe('k-atangana')
    expect(db.handleOf(namesake)).toBe('k-atangana-2')
    accounts.pop()
  })
})
