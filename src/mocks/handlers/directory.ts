import { http, HttpResponse } from 'msw'
import {
  CLIENT_ACCOUNT_TYPES,
  type BlockedUserDto,
  type ClientAccountType,
  type ContactPermissionDto,
  type DirectoryEntryDto,
  type DirectoryFacetsDto,
  type DirectorySort,
  type Paged,
  type ProfileReportDto,
  type ProfileReportReason,
} from '@/shared/api/contracts'
import {
  anyAccount,
  blockStore,
  canSeeProfile,
  contactModeFor,
  currentAccount,
  currentUser,
  directoryEntryDto,
  directoryProfiles,
  handles,
  isClientAccount,
  isListed,
  profileDto,
  profileOf,
  profileReportStore,
  publicProfileDto,
} from '../db'
import { directoryFacets, searchDirectory, type DirectoryFilter } from '../lib/directory'
import { api, latency, noContent, paginate, problem } from '../lib/http'
import { newId } from '../lib/ids'

/**
 * NET (screen 10): the directory, its facets, a profile with the contact permission of the user,
 * the reports; and the public page of a profile, without login (spec sections 10 and 15).
 */

const SORTS: readonly DirectorySort[] = ['relevance', 'name', 'recent']
const REPORT_REASONS: readonly ProfileReportReason[] = [
  'fake',
  'spam',
  'inappropriate',
  'harassment',
  'other',
]
const MAX_COMMENT_LENGTH = 1000
/** Cards of a page, unless the request asks for another size. */
const PAGE_SIZE = 20

const browses = () => currentUser().permissions.includes('directory:list')
const forbidden = () => problem(403, 'Forbidden', 'Your account type cannot browse the directory.')
const notFound = () =>
  problem(404, 'Profile not found', 'No profile of the directory has this address.')

const isClientTypeValue = (value: string): value is ClientAccountType =>
  CLIENT_ACCOUNT_TYPES.some((type) => type === value)

/** ?types=analyst,manager, or the parameter repeated. */
function readFilter(query: URLSearchParams): DirectoryFilter {
  const types = query
    .getAll('types')
    .flatMap((value) => value.split(','))
    .filter(isClientTypeValue)
  return {
    q: query.get('q')?.trim() || undefined,
    types: new Set(types),
    country: query.get('country') || undefined,
    specialty: query.get('specialty') || undefined,
    org: query.get('org') || undefined,
    language: query.get('language') || undefined,
    contactable: query.get('contactable') === 'true',
    recent: query.get('recent') === 'true',
  }
}

/** A profile the user may open: theirs, one of the directory, or one they talk with. */
function visibleProfile(userId: unknown) {
  const account = anyAccount(String(userId))
  if (!account || !isClientAccount(account)) return null
  const profile = profileOf(account)
  if (!canSeeProfile(currentAccount(), account, profile)) return null
  return { account, profile }
}

export const directoryHandlers = [
  http.get(api('/directory'), async ({ request }) => {
    await latency()
    if (!browses()) return forbidden()
    const query = new URL(request.url).searchParams
    const sort = SORTS.find((candidate) => candidate === query.get('sort')) ?? 'relevance'
    const profiles = directoryProfiles(currentAccount())
    const byId = new Map(profiles.map((profile) => [profile.account.id, profile]))
    const found = searchDirectory(
      profiles.map((profile) => profile.candidate),
      readFilter(query),
      sort,
    )
    if (!query.get('pageSize')) query.set('pageSize', String(PAGE_SIZE))
    const page = paginate(found, query)
    const handleOf = handles()
    return HttpResponse.json<Paged<DirectoryEntryDto>>({
      ...page,
      items: page.items.flatMap((candidate) => {
        const profile = byId.get(candidate.userId)
        return profile ? [directoryEntryDto(profile, handleOf.get(candidate.userId) ?? '')] : []
      }),
    })
  }),

  http.get(api('/directory/facets'), async () => {
    await latency()
    if (!browses()) return forbidden()
    const profiles = directoryProfiles(currentAccount())
    return HttpResponse.json<DirectoryFacetsDto>(
      directoryFacets(profiles.map((profile) => profile.candidate)),
    )
  }),

  http.get(api('/profiles/:userId'), async ({ params }) => {
    await latency()
    if (!browses()) return forbidden()
    const found = visibleProfile(params.userId)
    if (!found) return notFound()
    return HttpResponse.json(profileDto(found.account, found.profile))
  }),

  http.get(api('/profiles/:userId/contact-permission'), async ({ params }) => {
    await latency()
    if (!browses()) return forbidden()
    const found = visibleProfile(params.userId)
    if (!found) return notFound()
    return HttpResponse.json<ContactPermissionDto>({
      mode: contactModeFor(currentAccount(), found.account, found.profile),
    })
  }),

  http.post(api('/profiles/:userId/report'), async ({ params, request }) => {
    await latency()
    if (!browses()) return forbidden()
    const found = visibleProfile(params.userId)
    if (!found) return notFound()
    const reporter = currentAccount()
    if (found.account.id === reporter.id) {
      return problem(400, 'Invalid report', 'You cannot report your own profile.')
    }
    const body = (await request.json()) as Partial<ProfileReportDto>
    const reason = REPORT_REASONS.find((candidate) => candidate === body.reason)
    const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
    const errors: Record<string, string[]> = {}
    if (!reason) errors.reason = ['Choose a reason.']
    if (reason === 'other' && !comment) errors.comment = ['Say what is wrong.']
    if (comment.length > MAX_COMMENT_LENGTH) {
      errors.comment = [`${MAX_COMMENT_LENGTH} characters at most.`]
    }
    if (!reason || Object.keys(errors).length > 0) {
      return problem(400, 'Invalid report', undefined, errors)
    }
    const reports = profileReportStore.read()
    if (
      reports.some(
        (report) => report.userId === found.account.id && report.reporterId === reporter.id,
      )
    ) {
      return problem(409, 'Already reported', 'You already reported this profile.')
    }
    profileReportStore.write([
      ...reports,
      {
        id: newId('profile-report'),
        userId: found.account.id,
        reporterId: reporter.id,
        reason,
        comment,
        at: new Date().toISOString(),
      },
    ])
    return noContent()
  }),

  // The people the user blocked (spec sections 10 and 15): NET ME lists them, MSG blocks.
  http.get(api('/me/blocks'), async () => {
    await latency()
    if (!currentUser().permissions.includes('directory:profile')) return forbidden()
    const userId = currentAccount().id
    const blocked = blockStore
      .read()
      .filter((block) => block.blockerId === userId)
      .flatMap((block): BlockedUserDto[] => {
        const account = anyAccount(block.blockedId)
        return account
          ? [
              {
                userId: account.id,
                displayName: account.displayName,
                accountType: account.accountType,
                blockedAt: block.at,
              },
            ]
          : []
      })
    return HttpResponse.json(blocked)
  }),

  http.post(api('/blocks/:userId'), async ({ params }) => {
    await latency()
    if (!currentUser().permissions.includes('directory:profile')) return forbidden()
    const userId = currentAccount().id
    const account = anyAccount(String(params.userId))
    if (!account || !isClientAccount(account) || account.id === userId) return notFound()
    const blocks = blockStore.read()
    if (!blocks.some((block) => block.blockerId === userId && block.blockedId === account.id)) {
      blockStore.write([
        ...blocks,
        { blockerId: userId, blockedId: account.id, at: new Date().toISOString() },
      ])
    }
    return noContent()
  }),

  http.delete(api('/blocks/:userId'), async ({ params }) => {
    await latency()
    if (!currentUser().permissions.includes('directory:profile')) return forbidden()
    const userId = currentAccount().id
    blockStore.write(
      blockStore
        .read()
        .filter((block) => !(block.blockerId === userId && block.blockedId === params.userId)),
    )
    return noContent()
  }),

  // Without login: a profile its owner made public, without its contact details.
  http.get(api('/public/profiles/:slug'), async ({ params }) => {
    await latency()
    const slug = String(params.slug).toLowerCase()
    const userId = [...handles()].find(([, handle]) => handle === slug)?.[0]
    const account = userId ? anyAccount(userId) : undefined
    if (!account || !isClientAccount(account)) return notFound()
    const profile = profileOf(account)
    if (!isListed(account, profile) || profile.privacy.visibility !== 'public') return notFound()
    return HttpResponse.json(publicProfileDto(account, profile))
  }),
]
