import type {
  AccountCountsDto,
  AccountListStatus,
  AdminPayoutDto,
  AdminSubscriptionDto,
  AdminUserDetailsDto,
  AdminUserDto,
  AdminUserSort,
  AnalystRequestDto,
  LibraryPublicationDto,
  ModerationItemDto,
  VerificationStatus,
  VerifiedAccountType,
} from '@/shared/api/contracts'
import { ACCOUNT_TYPES } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addMonths } from '@/shared/lib/isoDate'
import {
  accountStore,
  analystStore,
  contentReportStore,
  organizationStore,
  publicationRules,
  publicationStore,
  readerContext,
  sharedStore,
  subscriptionOf,
  userArray,
  type StoredPurchase,
} from './db'
import { createAccounts, isVerifiedType, type StoredAccount } from './fixtures/accounts'
import { ADMIN_ACTOR } from './fixtures/admin'
import { PLANS } from './fixtures/billing'
import { generatePopulation, POPULATION_ORGANIZATIONS } from './fixtures/population'
import { ATANGANA } from './fixtures/research'
import { isExpired } from './lib/billing'
import { createRandom, hashString } from './lib/random'
import {
  latestVersion,
  paydayOf,
  payoutsOf,
  sumMonths,
  type StoredPublication,
} from './lib/research'
import { libraryPublication, mergeMonths, subjectOf } from './lib/researchViews'
import { normalize } from './lib/text'
import { isFirstPublication } from './publications'

// ---------------------------------------------------------------------------------------------
// Accounts

let population: StoredAccount[] | undefined

/** The generated accounts, made once per load from the seeds, not from what was stored since. */
function populationAccounts(): StoredAccount[] {
  population ??= generatePopulation(createAccounts(), Date.now())
  return population
}

/** Every account: the stored ones, then the generated ones nobody changed. */
export function directory(): StoredAccount[] {
  const stored = accountStore.read()
  const ids = new Set(stored.map((account) => account.id))
  return [...stored, ...populationAccounts().filter((account) => !ids.has(account.id))]
}

export function directoryAccount(id: string): StoredAccount | undefined {
  return (
    accountStore.read().find((account) => account.id === id) ??
    populationAccounts().find((account) => account.id === id)
  )
}

/** An account to change: a generated one is copied into the stored accounts first. */
export function editableAccount(id: string): StoredAccount | undefined {
  const stored = accountStore.read()
  const found = stored.find((account) => account.id === id)
  if (found) return found
  const generated = populationAccounts().find((account) => account.id === id)
  if (!generated) return undefined
  const copy = structuredClone(generated)
  accountStore.write([...stored, copy])
  return copy
}

export function organizationName(id: string | null): string | null {
  if (!id) return null
  return (
    organizationStore.read().find((organization) => organization.id === id)?.name ??
    POPULATION_ORGANIZATIONS.find((organization) => organization.id === id)?.name ??
    null
  )
}

/** Organisations an Admin can put an account in: the stored ones, then the generated ones. */
export function allOrganizations(): { id: string; name: string }[] {
  return [...organizationStore.read(), ...POPULATION_ORGANIZATIONS]
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const isEmployee = (account: Pick<StoredAccount, 'accountType'>) =>
  account.accountType === 'dataAdmin' || account.accountType === 'admin'

/** Active, under review (a status waiting for an Admin's approval) or suspended. */
export function listStatus(account: StoredAccount): AccountListStatus {
  if (account.status === 'suspended') return 'suspended'
  return isVerifiedType(account.accountType) && account.verificationStatus === 'pending'
    ? 'review'
    : 'active'
}

export function adminUserDto(account: StoredAccount): AdminUserDto {
  const organization = organizationName(account.organizationId)
  return {
    id: account.id,
    displayName: account.displayName,
    email: account.email,
    accountType: account.accountType,
    organization:
      organization && account.organizationId
        ? { id: account.organizationId, name: organization }
        : null,
    status: account.status,
    verificationStatus: isVerifiedType(account.accountType) ? account.verificationStatus : null,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
  }
}

/** Name, e-mail or organisation, without accents or case. */
export function matchesSearch(user: AdminUserDto, q: string): boolean {
  const query = normalize(q.trim())
  if (!query) return true
  return [user.displayName, user.email, user.organization?.name ?? ''].some((text) =>
    normalize(text).includes(query),
  )
}

const SORT_VALUES: Record<AdminUserSort, (user: AdminUserDto) => string> = {
  name: (user) => normalize(user.displayName.replace(/^\S+\s+/, '')),
  email: (user) => user.email,
  type: (user) => String(ACCOUNT_TYPES.indexOf(user.accountType)),
  organization: (user) => normalize(user.organization?.name ?? ''),
  status: (user) => user.status,
  createdAt: (user) => user.createdAt,
  lastLoginAt: (user) => user.lastLoginAt ?? '',
}

/** ?sort=-lastLoginAt: a column, descending with "-"; ties by name. */
export function sortUsers(users: AdminUserDto[], sort: AdminUserSort, descending: boolean) {
  const value = SORT_VALUES[sort]
  const byName = SORT_VALUES.name
  return users.sort((a, b) => {
    const order = value(a).localeCompare(value(b))
    return (descending ? -order : order) || byName(a).localeCompare(byName(b))
  })
}

/** The counters of screen 9: active accounts by type, analysts under review included. */
export function accountCounts(): AccountCountsDto {
  const counts = Object.fromEntries(ACCOUNT_TYPES.map((type) => [type, 0])) as AccountCountsDto
  for (const account of directory()) {
    if (account.status === 'active') counts[account.accountType] += 1
  }
  return counts
}

/** The city of the login, as the address gives it: the account's time zone in the prototype. */
const placeOf = (timeZone: string) => (timeZone.split('/').at(-1) ?? timeZone).replace(/_/g, ' ')

function subscriptionDto(account: StoredAccount): AdminSubscriptionDto | null {
  if (isEmployee(account)) return null
  const today = toMarketDay(Date.now())
  const subscription = subscriptionOf(account)
  if (subscription) {
    const plan = PLANS.find((candidate) => candidate.id === subscription.planId)
    return {
      planName: plan?.name ?? subscription.planId,
      status: isExpired(subscription, today) ? 'expired' : subscription.status,
      billingCycle: subscription.billingCycle,
      periodEnd: subscription.periodEnd,
      paidBy: subscription.payer.type,
    }
  }
  // A generated account: a yearly plan from its sign-up anniversary.
  if (!account.id.startsWith('user-p')) return null
  const day = account.createdAt.slice(0, 10)
  let periodEnd = addMonths(day, 12)
  while (periodEnd <= today) periodEnd = addMonths(periodEnd, 12)
  const planId =
    account.accountType === 'student'
      ? 'student'
      : account.accountType === 'trader'
        ? 'analysis'
        : 'professional'
  return {
    planName: PLANS.find((plan) => plan.id === planId)?.name ?? planId,
    status: 'active',
    billingCycle: 'yearly',
    periodEnd,
    paidBy: account.organizationId ? 'organization' : 'user',
  }
}

/** Research bought: the stored purchases of a seeded account, a few for a generated one. */
function purchasesOf(account: StoredAccount): AdminUserDetailsDto['purchases'] {
  if (isEmployee(account)) return null
  if (!account.id.startsWith('user-p')) {
    const purchases = userArray<StoredPurchase>('purchases', account.id)
    return {
      count: purchases.length,
      amount: purchases.reduce((total, purchase) => total + purchase.amount, 0),
    }
  }
  const random = createRandom(hashString(`purchases|${account.id}`))
  const count = Math.floor(random() * random() * 8)
  return { count, amount: count * 5_000 * (1 + Math.floor(random() * 4)) }
}

const publicationsOf = (analystId: string) =>
  publicationStore.read().filter((publication) => publication.analystId === analystId)

function publishingOf(account: StoredAccount): AdminUserDetailsDto['publishing'] {
  if (account.accountType !== 'analyst') return null
  const analyst = analystStore.read().find((candidate) => candidate.userId === account.id)
  // Those that went out, withdrawn ones included; not the drafts or those waiting.
  const publications = analyst
    ? publicationsOf(analyst.id).filter((publication) => publication.versions.length > 0)
    : []
  const ids = new Set(publications.map((publication) => publication.id))
  const reports = contentReportStore.read().filter((report) => ids.has(report.publicationId))
  const totals = sumMonths(mergeMonths(publications))
  return {
    publications: publications.length,
    withdrawn: publications.filter((publication) => publication.status === 'archived').length,
    sales: totals.sales,
    revenue: totals.revenue,
    reports: reports.length,
    openReports: reports.filter((report) => report.status === 'open').length,
  }
}

export function adminUserDetails(account: StoredAccount): AdminUserDetailsDto {
  return {
    ...adminUserDto(account),
    phone: account.phone,
    language: account.language,
    timeZone: account.timeZone,
    organizationRole: account.organizationRole,
    verificationDecision: isVerifiedType(account.accountType) ? account.verificationDecision : null,
    subscription: subscriptionDto(account),
    twoFactor: { channel: account.twoFactorChannel, mandatory: isEmployee(account) },
    lastLogin: account.lastLoginAt
      ? { at: account.lastLoginAt, place: placeOf(account.timeZone) }
      : null,
    purchases: purchasesOf(account),
    publishing: publishingOf(account),
    suspension: account.status === 'suspended' ? account.suspension : null,
  }
}

// ---------------------------------------------------------------------------------------------
// Status requests of Analysts, Journalists and CEOs

export function analystRequestDto(account: StoredAccount): AnalystRequestDto {
  return {
    id: account.id,
    accountType: account.accountType as VerifiedAccountType,
    displayName: account.displayName,
    email: account.email,
    organization: organizationName(account.organizationId),
    requestedAt: account.createdAt,
    documents: account.documents.map((document) => ({ ...document })),
    status: account.verificationStatus ?? 'pending',
    decision: account.verificationDecision,
  }
}

/** Newest first: the latest sign-ups, or the latest decisions (screen 9 mockup). */
export function analystRequests(status: VerificationStatus): AnalystRequestDto[] {
  const dateOf = (request: AnalystRequestDto) =>
    status === 'pending' ? request.requestedAt : (request.decision?.at ?? '')
  return directory()
    .filter(
      (account) => isVerifiedType(account.accountType) && account.verificationStatus === status,
    )
    .map(analystRequestDto)
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
}

/** The analyst profile of an approved account, made at the approval. */
export function ensureAnalystProfile(account: StoredAccount): void {
  const analysts = analystStore.read()
  if (analysts.some((analyst) => analyst.userId === account.id)) return
  const organization = organizationName(account.organizationId)
  analystStore.write([
    ...analysts,
    {
      id: `analyst-${account.id.replace(/^user-/, '')}`,
      userId: account.id,
      displayName: account.displayName,
      headline: organization ? `Analyst, ${organization}` : 'Independent analyst',
      since: toMarketDay(Date.now()),
      followers: 0,
    },
  ])
}

// ---------------------------------------------------------------------------------------------
// Moderation

const analystName = (analystId: string) =>
  analystStore.read().find((analyst) => analyst.id === analystId)?.displayName ?? analystId

function reporterName(userId: string): string {
  return directoryAccount(userId)?.displayName ?? userId
}

/**
 * The queue of screen 9: the publications readers reported, then those waiting for a moderator
 * (before publication, or a first publication).
 */
export function moderationQueue(): ModerationItemDto[] {
  const context = readerContext()
  const reports = contentReportStore.read().filter((report) => report.status === 'open')
  const items = publicationStore.read().flatMap((publication): ModerationItemDto[] => {
    const open = reports
      .filter((report) => report.publicationId === publication.id)
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    const kind =
      publication.status === 'pending'
        ? 'pending'
        : publication.status === 'published' && open.length > 0
          ? 'reported'
          : null
    if (!kind) return []
    const content = latestVersion(publication)?.content ?? publication.draft
    return [
      {
        publicationId: publication.id,
        kind,
        title: content.title,
        analyst: { id: publication.analystId, displayName: analystName(publication.analystId) },
        subject: subjectOf(content, context),
        status: publication.status,
        since: kind === 'pending' ? publication.savedAt : open[0].reportedAt,
        firstPublication:
          kind === 'pending' && isFirstPublication(publication.analystId, publication.id),
        reports: open.map((report) => ({
          id: report.id,
          reason: report.reason,
          comment: report.comment,
          reportedAt: report.reportedAt,
          reportedBy: reporterName(report.userId),
        })),
      },
    ]
  })
  return items.sort(
    (a, b) =>
      Number(a.kind === 'pending') - Number(b.kind === 'pending') || b.since.localeCompare(a.since),
  )
}

/**
 * What the moderator reads: the publication as its readers will see it, with its whole text;
 * the submitted draft of one waiting for approval.
 */
export function moderationView(publication: StoredPublication): LibraryPublicationDto | null {
  const context = { ...readerContext(), purchases: new Map(), reads: new Set<string>() }
  const pending = publication.versions.length === 0
  const view = libraryPublication(
    pending
      ? {
          ...publication,
          versions: [
            { number: 1, publishedAt: publication.savedAt, content: publication.draft, pages: 1 },
          ],
        }
      : publication,
    context,
  )
  if (!view) return null
  const content = pending
    ? publication.draft
    : (latestVersion(publication)?.content ?? publication.draft)
  return {
    ...view,
    status: publication.status,
    hasAccess: true,
    canBuy: false,
    canRate: false,
    watermark: null,
    isAuthor: false,
    body: content.body,
    charts: publication.charts,
    versions: pending ? [] : view.versions,
  }
}

// ---------------------------------------------------------------------------------------------
// Payouts

export interface StoredPayout {
  /** analystId:YYYY-MM */
  id: string
  analystId: string
  month: string
  paidAt: string
  paidBy: string
}

/** Paid until August; K. Atangana's September too, on 5 October, the others' still due. */
const PAID_UNTIL = '2026-09'

function createPaidPayouts(): StoredPayout[] {
  const publications = publicationStore.read()
  return analystStore.read().flatMap((analyst) =>
    Object.entries(
      mergeMonths(publications.filter((publication) => publication.analystId === analyst.id)),
    ).flatMap(([month, stats]) =>
      stats.sales > 0 && (month < PAID_UNTIL || (month === PAID_UNTIL && analyst.id === ATANGANA))
        ? [
            {
              id: `${analyst.id}:${month}`,
              analystId: analyst.id,
              month,
              paidAt: paydayOf(month),
              paidBy: ADMIN_ACTOR.displayName,
            },
          ]
        : [],
    ),
  )
}

export const payoutStore = sharedStore<StoredPayout[]>('payouts', createPaidPayouts)

export function paidMonths(analystId: string): Map<string, string> {
  return new Map(
    payoutStore
      .read()
      .filter((payout) => payout.analystId === analystId)
      .map((payout) => [payout.month, payout.paidAt]),
  )
}

/** Every analyst's monthly statements, newest first. */
export function adminPayouts(): AdminPayoutDto[] {
  const today = toMarketDay(Date.now())
  const { commissionPct } = publicationRules()
  const publications = publicationStore.read()
  const paidBy = new Map(payoutStore.read().map((payout) => [payout.id, payout.paidBy]))
  return analystStore
    .read()
    .flatMap((analyst) =>
      payoutsOf(
        mergeMonths(publications.filter((publication) => publication.analystId === analyst.id)),
        commissionPct,
        today,
        paidMonths(analyst.id),
      ).map((payout) => {
        const id = `${analyst.id}:${payout.month}`
        return {
          ...payout,
          id,
          analyst: { id: analyst.id, displayName: analyst.displayName },
          paidBy: paidBy.get(id) ?? null,
        }
      }),
    )
    .sort(
      (a, b) =>
        b.month.localeCompare(a.month) ||
        a.analyst.displayName.localeCompare(b.analyst.displayName),
    )
}
