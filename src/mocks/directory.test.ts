import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { ClientAccountType } from '@/shared/api/contracts'

// Thursday 5 November 2026, in Douala.
const NOW = Date.parse('2026-11-05T09:00:00Z')

type Db = typeof import('./db')
type Search = typeof import('./lib/directory')

// NET, the professional directory of screen 10.
describe('professional directory', () => {
  let db: Db
  let search: Search

  beforeAll(async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    db = await import('./db')
    search = await import('./lib/directory')
  })

  const account = (id: string) => db.anyAccount(id)!
  const candidates = (viewerId: string) =>
    db.directoryProfiles(account(viewerId)).map((profile) => profile.candidate)
  const names = (found: { displayName: string }[]) => found.map((profile) => profile.displayName)

  it('counts the types of the screen 10 mockup: most Students hide their profile', () => {
    const facets = search.directoryFacets(candidates('user-manager'))
    expect(facets.types).toEqual({
      student: 412,
      analyst: 96,
      manager: 212,
      trader: 348,
      journalist: 37,
      ceo: 58,
    })
    expect(facets.total).toBe(1_163)
    expect(facets.specialties[0]).toMatchObject({ value: expect.any(String) })
    expect(facets.countries.map((country) => country.value)).toContain('GQ')
  })

  it('finds the 64 profiles of the mockup search, for a Manager as for an Analyst', () => {
    const filter = {
      types: new Set<ClientAccountType>(['analyst', 'manager']),
      specialty: 'sovereign-bonds',
      contactable: true,
    }
    const forManager = search.searchDirectory(candidates('user-manager'), filter)
    expect(forManager).toHaveLength(64)
    // The most complete profiles first: the analysts the library knows, then the others.
    expect(names(forManager.slice(0, 3))).toEqual(['K. Atangana', 'M. Ndong', 'R. Ondo'])
    expect(names(forManager)).toContain('B. Ngoma')
    // The user is not one they can contact; D. Moussavou waits for an Admin's approval.
    expect(names(forManager)).not.toContain('P. Owona')
    expect(names(forManager)).not.toContain('D. Moussavou')
    expect(search.searchDirectory(candidates('user-analyst'), filter)).toHaveLength(64)
  })

  it('shows each viewer the button the rules give, a request or a closed door', () => {
    const tchakounte = (viewerId: string) =>
      candidates(viewerId).find((candidate) => candidate.userId === 'user-tchakounte')?.contactMode
    expect(tchakounte('user-manager')).toBe('none')
    expect(tchakounte('user-analyst')).toBe('request')
    expect(tchakounte('user-ceo')).toBe('direct')
    const moussavou = candidates('user-manager').find(
      (candidate) => candidate.userId === 'user-moussavou',
    )
    expect(moussavou).toMatchObject({ verified: false, contactMode: 'none' })
  })

  it('matches the text without accents, names first', () => {
    const all = candidates('user-analyst')
    const namesakes = names(search.searchDirectory(all, { q: 'tchakounte' }))
    expect(namesakes).toContain('A. Tchakounté')
    expect(namesakes.every((name) => /Tchakount/.test(name))).toBe(true)
    const insurer = search.searchDirectory(all, { q: 'insurer f' })
    expect(names(insurer)).toContain('A. Tchakounté')
    const bySpecialty = search.searchDirectory(all, { q: 'obligations souveraines' })
    expect(bySpecialty.every((found) => found.specialties.includes('sovereign-bonds'))).toBe(true)
  })

  it('keeps to the analysts who published in the last 90 days', () => {
    const recent = search.searchDirectory(candidates('user-manager'), { recent: true })
    expect(names(recent)).toEqual(expect.arrayContaining(['K. Atangana', 'M. Ndong']))
    expect(recent.every((found) => found.accountType === 'analyst')).toBe(true)
  })

  it('shows the contact details its owner shows, LinkedIn never', () => {
    const ndong = account('user-ndong')
    if (!db.isClientAccount(ndong)) throw new Error('M. Ndong is a client')
    const profile = db.profileDto(ndong)
    expect(profile.contact).toEqual({ workEmail: null, phone: null, linkedIn: null })
    expect(profile.analystId).toBe('analyst-ndong')
    const shown = db.profileOf(ndong)
    expect(
      db.profileDto(ndong, {
        ...shown,
        privacy: { ...shown.privacy, show: { ...shown.privacy.show, email: true } },
      }).contact,
    ).toEqual({ workEmail: 'm.ndong@ndong-research.example', phone: null, linkedIn: null })
    expect(db.publicProfileDto(ndong)).not.toHaveProperty('contact')
  })

  it('gives every account its own address, generated ones included', () => {
    const handles = [...db.handles().values()]
    expect(new Set(handles).size).toBe(handles.length)
    expect(db.handles().get('user-ndong')).toBe('m-ndong')
  })
})
