import type {
  AccountType,
  AnalystDto,
  AnalystRatingDto,
  CurrencyCode,
  LibraryItemDto,
  LibraryPublicationDto,
  MyPublicationDto,
  PublicationDto,
  PublicationSubjectDto,
} from '@/shared/api/contracts'
import { addMonths } from '@/shared/lib/isoDate'
import { docChartIds, docHeadings } from '@/shared/lib/richText'
import {
  accessOn,
  EMPTY_MONTH,
  hasChanges,
  isRecommendation,
  latestVersion,
  ratingOutcome,
  scoreOf,
  sumMonths,
  type MonthStats,
  type StoredAnalyst,
  type StoredContent,
  type StoredPublication,
} from './research'

export interface SubjectSecurity {
  id: string
  code: string
  name: string
  sector: string
  country: string
  currency: CurrencyCode
}

/** Who reads, and what they bought, read and rated: the server's view of the current user. */
export interface ReaderContext {
  today: string
  user: { id: string; displayName: string; accountType: AccountType; canBuy: boolean }
  security(id: string): SubjectSecurity | undefined
  countryName(code: string): string | undefined
  analyst(id: string): StoredAnalyst | undefined
  purchases: ReadonlyMap<string, { purchasedAt: string }>
  reads: ReadonlySet<string>
  myRatings: ReadonlyMap<string, number>
}

export function subjectOf(
  content: Pick<StoredContent, 'subjectType' | 'subjectId'>,
  context: Pick<ReaderContext, 'security' | 'countryName'>,
): PublicationSubjectDto | null {
  if (!content.subjectId) return null
  if (content.subjectType === 'company') {
    const security = context.security(content.subjectId)
    if (!security) return null
    const { id, code, name, country, sector, currency } = security
    return { type: 'company', id, code, name, country, sector, currency }
  }
  const name = context.countryName(content.subjectId)
  if (!name) return null
  const code = content.subjectId
  return { type: 'country', id: code, code, name, country: code, sector: null, currency: null }
}

export function isAuthor(publication: StoredPublication, context: ReaderContext): boolean {
  return context.analyst(publication.analystId)?.userId === context.user.id
}

/** A published publication in the library list; null for a draft or one in moderation. */
export function libraryItem(
  publication: StoredPublication,
  context: ReaderContext,
): LibraryItemDto | null {
  const first = publication.versions.at(0)
  const latest = latestVersion(publication)
  const analyst = context.analyst(publication.analystId)
  if (!first || !latest || !analyst) return null
  const subject = subjectOf(latest.content, context)
  if (!subject) return null
  const totals = sumMonths(publication.monthly)
  const access = accessOn(publication.pricing, first.publishedAt, context.today)
  const { content } = latest
  return {
    id: publication.id,
    title: content.title,
    subject,
    analyst: { id: analyst.id, displayName: analyst.displayName },
    publishedAt: first.publishedAt,
    updatedAt: latest === first ? null : latest.publishedAt,
    access,
    price: access === 'paid' ? publication.pricing.price : null,
    studentPrice: access === 'paid' ? publication.pricing.studentPrice : null,
    rating: content.rating,
    targetPrice: content.targetPrice,
    score: scoreOf(totals),
    scoreCount: totals.starCount,
    reads: totals.reads,
    status: publication.status,
    purchasedAt: context.purchases.get(publication.id)?.purchasedAt ?? null,
    isRead: context.reads.has(publication.id),
  }
}

/**
 * The preview: summary, contents, rating and price for all; the body and its charts once free,
 * bought, or for its author. Bought content carries the buyer's name.
 */
export function libraryPublication(
  publication: StoredPublication,
  context: ReaderContext,
): LibraryPublicationDto | null {
  const item = libraryItem(publication, context)
  const latest = latestVersion(publication)
  if (!item || !latest) return null
  const author = isAuthor(publication, context)
  const purchase = context.purchases.get(publication.id)
  const hasAccess =
    author ||
    purchase !== undefined ||
    (item.access === 'free' && publication.status === 'published')
  const { content } = latest
  const chartIds = new Set(docChartIds(content.body))
  const studentPrice = context.user.accountType === 'student' ? item.studentPrice : null
  return {
    ...item,
    summary: content.summary,
    contents: docHeadings(content.body),
    pages: latest.pages,
    horizonMonths: content.horizonMonths,
    referenceDate: content.referenceDate,
    referencePrice: content.referencePrice,
    dataDate: content.dataDate,
    disclosures: { ...content.disclosures },
    hasAccess,
    priceToPay: item.access === 'paid' ? (studentPrice ?? item.price) : null,
    canBuy:
      item.access === 'paid' &&
      !purchase &&
      !author &&
      context.user.canBuy &&
      publication.status === 'published',
    body: hasAccess ? content.body : null,
    charts: hasAccess ? publication.charts.filter((chart) => chartIds.has(chart.id)) : [],
    attachment: publication.attachment && {
      fileName: publication.attachment.fileName,
      size: publication.attachment.size,
    },
    version: latest.number,
    versions: publication.versions.map(({ number, publishedAt }) => ({ number, publishedAt })),
    myRating: context.myRatings.get(publication.id) ?? null,
    canRate: hasAccess && !author,
    watermark:
      purchase && !author
        ? { name: context.user.displayName, purchasedAt: purchase.purchasedAt }
        : null,
    isAuthor: author,
  }
}

export function myPublication(
  publication: StoredPublication,
  context: Pick<ReaderContext, 'security' | 'countryName'>,
): MyPublicationDto {
  return {
    id: publication.id,
    title: publication.draft.title,
    status: publication.status,
    subject: subjectOf(publication.draft, context),
    pricing: { ...publication.pricing },
    publishedAt: publication.versions.at(0)?.publishedAt ?? null,
    updatedAt: publication.savedAt,
    hasChanges: hasChanges(publication),
  }
}

export function publicationDto(
  publication: StoredPublication,
  context: Pick<ReaderContext, 'security' | 'countryName'>,
): PublicationDto {
  const { draft } = publication
  return {
    id: publication.id,
    status: publication.status,
    subjectType: draft.subjectType,
    subject: subjectOf(draft, context),
    title: draft.title,
    summary: draft.summary,
    body: draft.body,
    rating: draft.rating,
    targetPrice: draft.targetPrice,
    horizonMonths: draft.horizonMonths,
    referenceDate: draft.referenceDate,
    referencePrice: draft.referencePrice,
    dataDate: draft.dataDate,
    disclosures: { ...draft.disclosures },
    pricing: { ...publication.pricing },
    attachment: publication.attachment,
    charts: publication.charts,
    readFree: publication.readFree,
    versions: publication.versions.map(({ number, publishedAt }) => ({ number, publishedAt })),
    hasChanges: hasChanges(publication),
    archiveReason: publication.archiveReason,
    savedAt: publication.savedAt,
    version: publication.version,
  }
}

/** Every month of several publications added up. */
export function mergeMonths(
  publications: readonly StoredPublication[],
): Record<string, MonthStats> {
  const merged: Record<string, MonthStats> = {}
  for (const publication of publications) {
    for (const [month, stats] of Object.entries(publication.monthly)) {
      const total = (merged[month] ??= { ...EMPTY_MONTH })
      total.reads += stats.reads
      total.sales += stats.sales
      total.revenue += stats.revenue
      total.starSum += stats.starSum
      total.starCount += stats.starCount
    }
  }
  return merged
}

const round2 = (value: number) => Math.round(value * 100) / 100

/**
 * The public profile: publications, readers' average rating, and each Buy / Hold / Sell against
 * the price 12 months later (spec section 13).
 */
export function analystProfile(
  analyst: StoredAnalyst,
  publications: readonly StoredPublication[],
  context: Pick<ReaderContext, 'today' | 'security'> & {
    closeOn(id: string, day: string): number | undefined
    isFollowed: boolean
    isSelf: boolean
  },
): AnalystDto {
  const published = publications.filter(
    (publication) => publication.analystId === analyst.id && publication.status === 'published',
  )
  const totals = sumMonths(mergeMonths(published))
  const ratings = published
    .flatMap((publication): AnalystRatingDto[] => {
      const first = publication.versions.at(0)
      const content = latestVersion(publication)?.content
      if (!first || !content?.subjectId || !content.referencePrice) return []
      if (content.subjectType !== 'company' || !isRecommendation(content.rating)) return []
      const security = context.security(content.subjectId)
      if (!security) return []
      const day = first.publishedAt.slice(0, 10)
      const matured = addMonths(day, 12) <= context.today
      const priceAfter =
        context.closeOn(content.subjectId, matured ? addMonths(day, 12) : context.today) ?? null
      const changePct = priceAfter === null ? null : (priceAfter / content.referencePrice - 1) * 100
      return [
        {
          publicationId: publication.id,
          title: content.title,
          subjectCode: security.code,
          publishedAt: day,
          rating: content.rating,
          targetPrice: content.targetPrice,
          referencePrice: content.referencePrice,
          currency: security.currency,
          priceAfter,
          changePct: changePct === null ? null : round2(changePct),
          outcome: ratingOutcome(content.rating, changePct, matured),
        },
      ]
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const scored = ratings.filter((rating) => rating.outcome !== 'open')
  const confirmed = scored.filter((rating) => rating.outcome === 'confirmed').length
  return {
    id: analyst.id,
    displayName: analyst.displayName,
    headline: analyst.headline,
    since: analyst.since,
    publications: published.length,
    score: scoreOf(totals),
    scoreCount: totals.starCount,
    followers: analyst.followers,
    isFollowed: context.isFollowed,
    isSelf: context.isSelf,
    confirmedPct: scored.length === 0 ? null : Math.round((confirmed / scored.length) * 100),
    ratings,
  }
}
