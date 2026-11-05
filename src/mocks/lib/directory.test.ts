import { describe, expect, it } from 'vitest'
import { directoryFacets, matchScore, searchDirectory, type DirectoryCandidate } from './directory'

// The search of the directory, screen 10.
const candidate = (patch: Partial<DirectoryCandidate>): DirectoryCandidate => ({
  userId: 'user-x',
  displayName: 'X. Name',
  accountType: 'manager',
  verified: false,
  jobTitle: 'Portfolio manager',
  organization: 'Asset manager A',
  city: 'Douala',
  country: 'CM',
  languages: ['fr'],
  specialties: [],
  specialtyNames: [],
  about: '',
  experiences: 0,
  hasPhoto: false,
  followers: 0,
  memberSince: '2026-01-01T08:00:00Z',
  contactMode: 'direct',
  recentlyPublished: false,
  ...patch,
})

const atangana = candidate({
  userId: 'user-analyst',
  displayName: 'K. Atangana',
  accountType: 'analyst',
  jobTitle: 'CEMAC equity & sovereign analyst',
  organization: 'Independent',
  specialties: ['sovereign-bonds'],
  specialtyNames: ['Sovereign bonds', 'Obligations souveraines'],
  about: 'Twelve years of analysis.',
  followers: 412,
  memberSince: '2024-11-04T10:30:00Z',
})
const tchakounte = candidate({
  userId: 'user-tchakounte',
  displayName: 'A. Tchakounté',
  organization: 'Insurer F',
  city: 'Yaoundé',
  contactMode: 'none',
  memberSince: '2026-02-16T08:20:00Z',
})
const owona = candidate({
  userId: 'user-manager',
  displayName: 'P. Owona',
  languages: ['fr', 'en'],
})

describe('directory search', () => {
  it('scores the name first, then the job, the organisation and the specialties', () => {
    expect(matchScore(atangana, 'atan')).toBe(3)
    expect(matchScore(atangana, 'tangan')).toBe(2)
    expect(matchScore(atangana, 'souveraines')).toBe(1)
    expect(matchScore(tchakounte, 'YAOUNDE insurer')).toBe(1)
    expect(matchScore(tchakounte, 'Tchakounte')).toBe(3)
    expect(matchScore(owona, 'bank')).toBe(0)
    expect(matchScore(owona, '  ')).toBe(1)
  })

  it('filters by type, language and contact, and sorts by surname or by date', () => {
    const all = [owona, tchakounte, atangana]
    expect(searchDirectory(all, { contactable: true }).map((found) => found.userId)).toEqual([
      'user-analyst',
      'user-manager',
    ])
    const managers = searchDirectory(all, { types: new Set(['manager']), language: 'en' })
    expect(managers.map((found) => found.userId)).toEqual(['user-manager'])
    expect(searchDirectory(all, {}, 'name').map((found) => found.displayName)).toEqual([
      'K. Atangana',
      'P. Owona',
      'A. Tchakounté',
    ])
    expect(searchDirectory(all, {}, 'recent').at(0)?.displayName).toBe('A. Tchakounté')
  })

  it('counts the facets of every profile, the largest first', () => {
    const facets = directoryFacets([owona, tchakounte, atangana])
    expect(facets.types).toEqual({
      student: 0,
      analyst: 1,
      manager: 2,
      trader: 0,
      journalist: 0,
      ceo: 0,
    })
    expect(facets.languages).toEqual([
      { value: 'fr', count: 3 },
      { value: 'en', count: 1 },
    ])
    expect(facets.organizations.at(0)).toEqual({ value: 'Asset manager A', count: 1 })
  })
})
