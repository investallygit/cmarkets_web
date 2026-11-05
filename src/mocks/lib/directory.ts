import {
  CLIENT_ACCOUNT_TYPES,
  type ClientAccountType,
  type ContactMode,
  type DirectoryFacetsDto,
  type DirectorySort,
  type FacetCountDto,
} from '@/shared/api/contracts'
import { normalize } from './text'

/**
 * The search of the professional directory (spec sections 9 and 15, screen 10): its filters, its
 * orders and the counts of its facets, over the profiles listed.
 */

/** A listed profile, as the search reads it. */
export interface DirectoryCandidate {
  userId: string
  displayName: string
  accountType: ClientAccountType
  verified: boolean
  jobTitle: string
  organization: string
  city: string
  country: string
  languages: readonly string[]
  /** Ids of the specialties. */
  specialties: readonly string[]
  /** Their names in both languages, which the text search reads too. */
  specialtyNames: readonly string[]
  about: string
  experiences: number
  hasPhoto: boolean
  /** An Analyst's; 0 for the others. */
  followers: number
  memberSince: string
  /** The button the user sees on the card. */
  contactMode: ContactMode
  /** An Analyst who published in the last 90 days. */
  recentlyPublished: boolean
}

export interface DirectoryFilter {
  q?: string
  /** Empty or absent: every type. */
  types?: ReadonlySet<ClientAccountType>
  country?: string
  specialty?: string
  org?: string
  language?: string
  contactable?: boolean
  recent?: boolean
}

const wordsOf = (text: string) =>
  normalize(text)
    .split(/[\s.'-]+/)
    .filter(Boolean)

/**
 * How well a profile matches the text, without accents or case: 3 when every word starts a word
 * of the name ("atan" for K. Atangana), 2 when the name holds them, 1 when the job, the
 * organisation, the city and the specialties do; 0 otherwise. Every profile matches no text.
 */
export function matchScore(candidate: DirectoryCandidate, q: string | undefined): number {
  const words = wordsOf(q ?? '')
  if (words.length === 0) return 1
  const nameWords = wordsOf(candidate.displayName)
  if (words.every((word) => nameWords.some((nameWord) => nameWord.startsWith(word)))) return 3
  const name = normalize(candidate.displayName)
  if (words.every((word) => name.includes(word))) return 2
  const text = normalize(
    [
      candidate.displayName,
      candidate.jobTitle,
      candidate.organization,
      candidate.city,
      ...candidate.specialtyNames,
    ].join(' '),
  )
  return words.every((word) => text.includes(word)) ? 1 : 0
}

/**
 * What a profile says, then how followed an Analyst is: after the text, the order of relevance.
 * The About, the specialties, the experience, the photo and the VERIFIED badge each count.
 */
export function profileWeight(candidate: DirectoryCandidate): number {
  return (
    (candidate.about ? 2 : 0) +
    Math.min(candidate.specialties.length, 4) * 0.5 +
    (candidate.experiences > 0 ? 1 : 0) +
    (candidate.hasPhoto ? 1 : 0) +
    (candidate.verified ? 1 : 0) +
    Math.log10(1 + candidate.followers)
  )
}

export function matchesDirectoryFilter(
  candidate: DirectoryCandidate,
  filter: DirectoryFilter,
): boolean {
  if (filter.types && filter.types.size > 0 && !filter.types.has(candidate.accountType)) {
    return false
  }
  if (filter.country && candidate.country !== filter.country) return false
  if (filter.specialty && !candidate.specialties.includes(filter.specialty)) return false
  if (filter.org && normalize(candidate.organization) !== normalize(filter.org)) return false
  if (filter.language && !candidate.languages.includes(filter.language)) return false
  if (filter.contactable && candidate.contactMode === 'none') return false
  if (filter.recent && !candidate.recentlyPublished) return false
  return matchScore(candidate, filter.q) > 0
}

/** "K. Atangana" sorts under A: the surname, then the initial. */
const surnameKey = (name: string) => {
  const words = wordsOf(name)
  return [...words.slice(1), ...words.slice(0, 1)].join(' ')
}

const byName = (a: DirectoryCandidate, b: DirectoryCandidate) =>
  surnameKey(a.displayName).localeCompare(surnameKey(b.displayName)) ||
  a.userId.localeCompare(b.userId)

/** The filtered profiles, best match first, by name, or the newest members first. */
export function searchDirectory(
  candidates: readonly DirectoryCandidate[],
  filter: DirectoryFilter,
  sort: DirectorySort = 'relevance',
): DirectoryCandidate[] {
  const found = candidates.filter((candidate) => matchesDirectoryFilter(candidate, filter))
  if (sort === 'name') return found.sort(byName)
  if (sort === 'recent') {
    return found.sort((a, b) => b.memberSince.localeCompare(a.memberSince) || byName(a, b))
  }
  const scores = new Map(
    found.map((candidate) => [
      candidate.userId,
      { match: matchScore(candidate, filter.q), weight: profileWeight(candidate) },
    ]),
  )
  return found.sort((a, b) => {
    const left = scores.get(a.userId)
    const right = scores.get(b.userId)
    if (!left || !right) return 0
    return right.match - left.match || right.weight - left.weight || byName(a, b)
  })
}

function counted(values: Iterable<string>): FacetCountDto[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

/** The counts of the whole directory, by type, country, specialty, organisation and language. */
export function directoryFacets(candidates: readonly DirectoryCandidate[]): DirectoryFacetsDto {
  const types = Object.fromEntries(CLIENT_ACCOUNT_TYPES.map((type) => [type, 0])) as Record<
    ClientAccountType,
    number
  >
  for (const candidate of candidates) types[candidate.accountType] += 1
  return {
    total: candidates.length,
    types,
    countries: counted(candidates.map((candidate) => candidate.country)),
    specialties: counted(candidates.flatMap((candidate) => candidate.specialties)),
    organizations: counted(candidates.map((candidate) => candidate.organization)),
    languages: counted(candidates.flatMap((candidate) => candidate.languages)),
  }
}
