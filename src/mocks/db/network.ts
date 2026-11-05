import type { MyProfileDto, ProfileStatsDto } from '@/shared/api/contracts'
import { isVerifiedType, type StoredAccount } from '../fixtures/accounts'
import { createProfiles, defaultProfile, type StoredProfile } from '../fixtures/network'
import { scoreOf, sumMonths } from '../lib/research'
import { mergeMonths } from '../lib/researchViews'
import { accountStore, organizationStore } from './accounts'
import { analystStore, publicationStore } from './research'
import { sharedStore } from './storage'

/** The professional profiles of the directory (spec section 15), which every account reads. */

/** The profiles the users wrote; a client who never did has the one the account gives. */
export const profileStore = sharedStore<StoredProfile[]>('profiles', createProfiles)

export function profileOf(account: StoredAccount): StoredProfile {
  const stored = profileStore.read().find((profile) => profile.userId === account.id)
  if (stored) return stored
  const organization = organizationStore
    .read()
    .find((candidate) => candidate.id === account.organizationId)
  return defaultProfile(account, organization?.name ?? null)
}

/** Writes a profile back, the first time as one of the stored ones. */
export function saveProfile(profile: StoredProfile): void {
  const others = profileStore.read().filter((candidate) => candidate.userId !== profile.userId)
  profileStore.write([...others, profile])
}

const slugOf = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** "K. Atangana" gives "k-atangana"; a name another account took first gets a number. */
export function handleOf(account: StoredAccount): string {
  const slug = slugOf(account.displayName) || 'member'
  const rank = accountStore
    .read()
    .filter((other) => slugOf(other.displayName) === slug)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .findIndex((other) => other.id === account.id)
  return rank <= 0 ? slug : `${slug}-${rank + 1}`
}

/** An Analyst's publications, readers' average score and followers; null for the other types. */
export function statsOf(account: StoredAccount): ProfileStatsDto | null {
  if (account.accountType !== 'analyst') return null
  const analyst = analystStore.read().find((candidate) => candidate.userId === account.id)
  if (!analyst) return { publications: 0, rating: null, followers: 0 }
  const published = publicationStore
    .read()
    .filter(
      (publication) => publication.analystId === analyst.id && publication.status === 'published',
    )
  return {
    publications: published.length,
    rating: scoreOf(sumMonths(mergeMonths(published))),
    followers: analyst.followers,
  }
}

/** GET /me/profile */
export function myProfileDto(account: StoredAccount): MyProfileDto {
  const profile = profileOf(account)
  return {
    userId: account.id,
    handle: handleOf(account),
    displayName: account.displayName,
    accountType: account.accountType,
    verified: isVerifiedType(account.accountType) && account.verificationStatus === 'approved',
    photoUrl: profile.photo,
    jobTitle: profile.jobTitle,
    organization: profile.organization,
    city: profile.city,
    country: profile.country,
    languages: [...profile.languages],
    about: profile.about,
    specialties: [...profile.specialties],
    experiences: profile.experiences.map((experience) => ({ ...experience })),
    contact: { ...profile.contact },
    stats: statsOf(account),
    memberSince: account.createdAt,
    updatedAt: profile.updatedAt,
  }
}
