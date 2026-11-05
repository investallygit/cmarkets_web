import type {
  ClientAccountType,
  ContactMode,
  DirectoryEntryDto,
  MyProfileDto,
  ProfileDto,
  ProfileStatsDto,
  PublicProfileDto,
  SpecialtyDto,
} from '@/shared/api/contracts'
import { createAccounts, isVerifiedType, type StoredAccount } from '../fixtures/accounts'
import { generateProfiles } from '../fixtures/directory'
import {
  createProfiles,
  defaultProfile,
  PROFILE_REPORT_FIXTURES,
  SPECIALTIES,
  type StoredProfile,
  type StoredProfileReport,
} from '../fixtures/network'
import { contactMode, isClientType } from '../lib/contact'
import type { DirectoryCandidate } from '../lib/directory'
import { scoreOf, sumMonths } from '../lib/research'
import { mergeMonths } from '../lib/researchViews'
import { allAccounts, organizationName, populationAccounts } from './accounts'
import { directorySettingsStore, permissionsOf } from './platform'
import { analystStore, publicationStore } from './research'
import { sharedStore } from './storage'

/**
 * The professional profiles of the directory (spec section 15), which every account reads: who
 * is listed, who may write to whom, and what each viewer sees of a profile.
 */

/** The profiles the users wrote; a client who never did has the one the account gives. */
export const profileStore = sharedStore<StoredProfile[]>('profiles', createProfiles)

let generated: Map<string, StoredProfile> | undefined

/** The profiles of the generated accounts, made once per load as the accounts are. */
function generatedProfiles(): Map<string, StoredProfile> {
  generated ??= generateProfiles(populationAccounts(), createAccounts(), organizationName)
  return generated
}

/** A client's profile: the one they wrote, or one with the Admin's default contact rules. */
export function profileOf(account: StoredAccount): StoredProfile {
  const stored = profileStore.read().find((profile) => profile.userId === account.id)
  if (stored) return stored
  return (
    generatedProfiles().get(account.id) ??
    defaultProfile(
      account,
      organizationName(account.organizationId),
      directorySettingsStore.read().defaultContactRules,
    )
  )
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

/**
 * The handle of every account: "K. Atangana" gives "k-atangana"; a name another account took
 * first gets a number, "k-atangana-2".
 */
export function handles(): Map<string, string> {
  const bySlug = new Map<string, StoredAccount[]>()
  for (const account of allAccounts()) {
    const slug = slugOf(account.displayName) || 'member'
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), account])
  }
  const result = new Map<string, string>()
  for (const [slug, accounts] of bySlug) {
    accounts
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      .forEach((account, rank) => result.set(account.id, rank === 0 ? slug : `${slug}-${rank + 1}`))
  }
  return result
}

export const handleOf = (account: StoredAccount): string =>
  handles().get(account.id) ?? slugOf(account.displayName)

const analystOf = (account: StoredAccount) =>
  analystStore.read().find((candidate) => candidate.userId === account.id)

/** An Analyst's publications, readers' average score and followers; null for the other types. */
export function statsOf(account: StoredAccount): ProfileStatsDto | null {
  if (account.accountType !== 'analyst') return null
  const analyst = analystOf(account)
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

/** An account of one of the six client types, the only ones with a profile. */
export type ClientAccount = StoredAccount & { accountType: ClientAccountType }

export const isClientAccount = (account: StoredAccount): account is ClientAccount =>
  isClientType(account.accountType)

const isVerified = (account: StoredAccount) =>
  isVerifiedType(account.accountType) && account.verificationStatus === 'approved'

/** GET /me/profile */
export function myProfileDto(account: StoredAccount): MyProfileDto {
  const profile = profileOf(account)
  return {
    userId: account.id,
    handle: handleOf(account),
    displayName: account.displayName,
    accountType: account.accountType,
    verified: isVerified(account),
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

// ---------------------------------------------------------------------------------------------
// The directory

/**
 * Writes and is written to (spec section 15): a client whose type has messages:write and, for
 * an Analyst, a Journalist or a CEO, whose status an Admin approved.
 */
export function mayMessage(account: StoredAccount): boolean {
  return (
    account.status === 'active' &&
    permissionsOf(account.accountType).includes('messages:write') &&
    (!isVerifiedType(account.accountType) || account.verificationStatus === 'approved')
  )
}

/** In the directory: an active client of a type listed there, who does not hide the profile. */
export function isListed(account: StoredAccount, profile = profileOf(account)): boolean {
  return (
    isClientAccount(account) &&
    account.status === 'active' &&
    permissionsOf(account.accountType).includes('directory:profile') &&
    profile.privacy.visibility !== 'hidden'
  )
}

/** Who blocked whom: a block overrides every rule (spec section 15). */
export interface StoredBlock {
  blockerId: string
  blockedId: string
  at: string
}

export const blockStore = sharedStore<StoredBlock[]>('blocks', () => [])

/** A block between two users, as the first one sees it. */
export function blockBetween(userId: string, otherId: string): 'byMe' | 'byThem' | null {
  const blocks = blockStore.read()
  if (blocks.some((block) => block.blockerId === userId && block.blockedId === otherId)) {
    return 'byMe'
  }
  if (blocks.some((block) => block.blockerId === otherId && block.blockedId === userId)) {
    return 'byThem'
  }
  return null
}

/** A conversation of two users: open, or a contact request not answered yet. */
type ConversationLookup = (userId: string, otherId: string) => 'open' | 'request' | null

let conversationBetween: ConversationLookup = () => null

/** The messaging tells how to find a conversation of two users (db/messaging.ts). */
export function setConversationLookup(lookup: ConversationLookup): void {
  conversationBetween = lookup
}

/**
 * GET /profiles/{id}/contact-permission: a block first, a conversation already open, then the
 * rule of the profile for the viewer's type.
 */
export function contactModeFor(
  viewer: StoredAccount,
  account: StoredAccount,
  profile = profileOf(account),
): ContactMode {
  return contactMode({
    sender: { userId: viewer.id, accountType: viewer.accountType, messaging: mayMessage(viewer) },
    recipient: {
      userId: account.id,
      accountType: account.accountType,
      messaging: mayMessage(account),
      visibility: profile.privacy.visibility,
      contactRules: profile.privacy.contactRules,
    },
    blocked: blockBetween(viewer.id, account.id) !== null,
    conversationOpen: conversationBetween(viewer.id, account.id) === 'open',
  })
}

/**
 * The viewer may open the profile: their own; one of the directory, unless its owner blocked
 * them; a hidden one, if the two already have a conversation.
 */
export function canSeeProfile(
  viewer: StoredAccount,
  account: ClientAccount,
  profile = profileOf(account),
): boolean {
  if (viewer.id === account.id) return true
  if (blockBetween(account.id, viewer.id) === 'byMe') return false
  if (isListed(account, profile)) return true
  return account.status === 'active' && conversationBetween(viewer.id, account.id) !== null
}

const DAY_MS = 86_400_000

/** The users of the Analysts who published in the last 90 days. */
function recentAuthors(now: number): Set<string> {
  const since = new Date(now - 90 * DAY_MS).toISOString()
  const analystIds = new Set(
    publicationStore
      .read()
      .filter(
        (publication) =>
          publication.status === 'published' &&
          (publication.versions[0]?.publishedAt ?? '') >= since,
      )
      .map((publication) => publication.analystId),
  )
  return new Set(
    analystStore
      .read()
      .filter((analyst) => analystIds.has(analyst.id) && analyst.userId)
      .map((analyst) => analyst.userId ?? ''),
  )
}

/** The closed list of specialties (spec section 15), which the Admin manages in ADMCFG. */
export const specialtyStore = sharedStore<SpecialtyDto[]>('specialties', () =>
  SPECIALTIES.map((specialty) => ({ id: specialty.id, name: { ...specialty.name } })),
)

/** Every profile, listed or not, by the ids of its specialties: what a removal would empty. */
export function specialtyUses(): Map<string, number> {
  const stored = profileStore.read()
  const ids = new Set(stored.map((profile) => profile.userId))
  const profiles = [
    ...stored,
    ...[...generatedProfiles().values()].filter((profile) => !ids.has(profile.userId)),
  ]
  const uses = new Map<string, number>()
  for (const id of profiles.flatMap((profile) => profile.specialties)) {
    uses.set(id, (uses.get(id) ?? 0) + 1)
  }
  return uses
}

const specialtyNames = (ids: readonly string[]) =>
  specialtyStore
    .read()
    .filter((specialty) => ids.includes(specialty.id))
    .flatMap((specialty) => [specialty.name.en, specialty.name.fr])

/** A listed profile, with what the search reads and what its card shows. */
export interface DirectoryProfile {
  account: StoredAccount
  profile: StoredProfile
  candidate: DirectoryCandidate
}

/** The profiles of the directory as the viewer finds them, with the button each card shows. */
export function directoryProfiles(viewer: StoredAccount, now = Date.now()): DirectoryProfile[] {
  const recent = recentAuthors(now)
  const followers = new Map(
    analystStore.read().map((analyst) => [analyst.userId ?? '', analyst.followers]),
  )
  // The blocked person no longer sees the profile (spec section 15).
  const blockers = new Set(
    blockStore
      .read()
      .filter((block) => block.blockedId === viewer.id)
      .map((block) => block.blockerId),
  )
  return allAccounts().flatMap((account) => {
    const profile = profileOf(account)
    if (!isClientAccount(account) || !isListed(account, profile) || blockers.has(account.id)) {
      return []
    }
    const candidate: DirectoryCandidate = {
      userId: account.id,
      displayName: account.displayName,
      accountType: account.accountType,
      verified: isVerified(account),
      jobTitle: profile.jobTitle,
      organization: profile.organization,
      city: profile.city,
      country: profile.country,
      languages: profile.languages,
      specialties: profile.specialties,
      specialtyNames: specialtyNames(profile.specialties),
      about: profile.about,
      experiences: profile.experiences.length,
      hasPhoto: profile.photo !== null,
      followers: followers.get(account.id) ?? 0,
      memberSince: account.createdAt,
      contactMode: contactModeFor(viewer, account, profile),
      recentlyPublished: recent.has(account.id),
    }
    return [{ account, profile, candidate }]
  })
}

/** A card of GET /directory. */
export function directoryEntryDto(
  { account, profile, candidate }: DirectoryProfile,
  handle: string,
): DirectoryEntryDto {
  return {
    userId: account.id,
    handle,
    displayName: account.displayName,
    accountType: candidate.accountType,
    verified: candidate.verified,
    photoUrl: profile.photo,
    jobTitle: profile.jobTitle,
    organization: profile.organization,
    city: profile.city,
    country: profile.country,
    specialties: [...profile.specialties],
    stats: profile.privacy.show.publicationStats ? statsOf(account) : null,
    memberSince: account.createdAt,
    contactMode: candidate.contactMode,
  }
}

/** GET /public/profiles/{slug}: no contact details, no rules. */
export function publicProfileDto(
  account: ClientAccount,
  profile = profileOf(account),
): PublicProfileDto {
  return {
    userId: account.id,
    handle: handleOf(account),
    displayName: account.displayName,
    accountType: account.accountType,
    verified: isVerified(account),
    photoUrl: profile.photo,
    jobTitle: profile.jobTitle,
    organization: profile.organization,
    city: profile.city,
    country: profile.country,
    languages: [...profile.languages],
    about: profile.about,
    specialties: [...profile.specialties],
    experiences: profile.experiences.map((experience) => ({ ...experience })),
    stats: profile.privacy.show.publicationStats ? statsOf(account) : null,
    memberSince: account.createdAt,
    analystId: analystOf(account)?.id ?? null,
  }
}

/**
 * GET /profiles/{userId}: the contact details the user shows and the rules of the profile.
 * LinkedIn has no display setting on screen 12: it stays hidden, as by default.
 */
export function profileDto(account: ClientAccount, profile = profileOf(account)): ProfileDto {
  const { show, contactRules } = profile.privacy
  return {
    ...publicProfileDto(account, profile),
    contact: {
      workEmail: show.email ? profile.contact.workEmail : null,
      phone: show.phone ? profile.contact.phone : null,
      linkedIn: null,
    },
    contactRules: { ...contactRules },
  }
}

export type { StoredProfileReport }

/** The reports of profiles, which the Admin reviews in MOD. */
export const profileReportStore = sharedStore<StoredProfileReport[]>('profileReports', () =>
  PROFILE_REPORT_FIXTURES.map((report) => ({ ...report })),
)
