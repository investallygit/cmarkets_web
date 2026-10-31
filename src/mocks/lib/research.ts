import type {
  AttachmentDto,
  FrozenChartDto,
  IsoDate,
  IsoDateTime,
  LibraryItemDto,
  LibrarySort,
  PayoutDto,
  PublicationAccess,
  PublicationDisclosures,
  PublicationPricingDto,
  PublicationRating,
  PublicationRulesDto,
  PublicationStatus,
  Recommendation,
  RichTextDoc,
  SubjectType,
} from '@/shared/api/contracts'
import { addMonths } from '@/shared/lib/isoDate'
import { isDocEmpty } from '@/shared/lib/richText'
import { normalize } from './text'

/** What the analyst writes; a published version keeps a copy of it. */
export interface StoredContent {
  subjectType: SubjectType
  subjectId: string | null
  title: string
  summary: string
  body: RichTextDoc
  rating: PublicationRating | null
  targetPrice: number | null
  horizonMonths: number | null
  referenceDate: IsoDate | null
  referencePrice: number | null
  dataDate: IsoDate | null
  disclosures: PublicationDisclosures
}

export interface StoredVersion {
  number: number
  publishedAt: IsoDateTime
  content: StoredContent
  pages: number
}

/** A month of a publication: reads, sales and readers' ratings. */
export interface MonthStats {
  reads: number
  sales: number
  revenue: number
  starSum: number
  starCount: number
}

export interface StoredPublication {
  id: string
  analystId: string
  status: PublicationStatus
  createdAt: IsoDateTime
  savedAt: IsoDateTime
  version: number
  /** The working copy the studio edits; readers see the latest version. */
  draft: StoredContent
  pricing: PublicationPricingDto
  attachment: AttachmentDto | null
  charts: FrozenChartDto[]
  versions: StoredVersion[]
  archiveReason: string | null
  readFree: boolean
  /** By month, YYYY-MM. */
  monthly: Record<string, MonthStats>
}

export interface StoredAnalyst {
  id: string
  /** The CMarket account that writes as this analyst, if any. */
  userId: string | null
  displayName: string
  headline: string
  since: IsoDate
  followers: number
}

export const NO_DISCLOSURES: PublicationDisclosures = {
  conflicts: false,
  disclaimer: false,
  sources: false,
}

export const EMPTY_MONTH: MonthStats = { reads: 0, sales: 0, revenue: 0, starSum: 0, starCount: 0 }

export const monthOf = (day: string) => day.slice(0, 7)

export function latestVersion(publication: StoredPublication): StoredVersion | undefined {
  return publication.versions.at(-1)
}

/** Saved changes that the latest version does not have. */
export function hasChanges(publication: StoredPublication): boolean {
  const latest = latestVersion(publication)
  return (
    latest !== undefined && JSON.stringify(latest.content) !== JSON.stringify(publication.draft)
  )
}

/** Totals of the months between two YYYY-MM, both included; all months without bounds. */
export function sumMonths(
  monthly: Record<string, MonthStats>,
  from = '0000-00',
  to = '9999-99',
): MonthStats {
  const total = { ...EMPTY_MONTH }
  for (const [month, stats] of Object.entries(monthly)) {
    if (month < from || month > to) continue
    total.reads += stats.reads
    total.sales += stats.sales
    total.revenue += stats.revenue
    total.starSum += stats.starSum
    total.starCount += stats.starCount
  }
  return total
}

/** Average of 1-to-5 ratings, to one decimal. */
export function scoreOf(stats: Pick<MonthStats, 'starSum' | 'starCount'>): number | null {
  return stats.starCount === 0 ? null : Math.round((stats.starSum / stats.starCount) * 10) / 10
}

/** A paid publication turns free `freeAfterMonths` after it was first published. */
export function accessOn(
  pricing: PublicationPricingDto,
  publishedAt: IsoDateTime | null,
  today: IsoDate,
): PublicationAccess {
  if (pricing.access === 'free') return 'free'
  if (pricing.freeAfterMonths && publishedAt) {
    if (addMonths(publishedAt.slice(0, 10), pricing.freeAfterMonths) <= today) return 'free'
  }
  return 'paid'
}

/** A Hold is confirmed while the price stays within this band. */
export const HOLD_BAND_PCT = 10

/**
 * A rating against the price 12 months later: a Buy is confirmed by a rise, a Sell by a fall, a
 * Hold by a move within ±10%. Ratings not yet 12 months old stay open.
 */
export function ratingOutcome(
  rating: Recommendation,
  changePct: number | null,
  matured: boolean,
): 'confirmed' | 'missed' | 'open' {
  if (!matured || changePct === null) return 'open'
  const confirmed =
    rating === 'buy'
      ? changePct > 0
      : rating === 'sell'
        ? changePct < 0
        : Math.abs(changePct) <= HOLD_BAND_PCT
  return confirmed ? 'confirmed' : 'missed'
}

const RECOMMENDATIONS: readonly PublicationRating[] = ['buy', 'hold', 'sell']
const OUTLOOKS: readonly PublicationRating[] = ['positive', 'stable', 'negative']

export function isRecommendation(rating: PublicationRating | null): rating is Recommendation {
  return rating !== null && RECOMMENDATIONS.includes(rating)
}

/** Buy / Hold / Sell fit a company, an outlook a country. */
export function ratingFits(subjectType: SubjectType, rating: PublicationRating): boolean {
  return (subjectType === 'company' ? RECOMMENDATIONS : OUTLOOKS).includes(rating)
}

type Errors = Record<string, string[]>

const formatXaf = (value: number) => value.toLocaleString('en-US')

/**
 * Pricing rules (spec section 13): a paid price within the Admin's range, a student price below
 * it, and no way back to paid once read for free.
 */
export function pricingErrors(
  pricing: PublicationPricingDto,
  rules: PublicationRulesDto,
  current: { access: PublicationAccess; readFree: boolean },
): Errors {
  const errors: Errors = {}
  if (pricing.access === 'paid' && current.access === 'free' && current.readFree) {
    errors.access = ['Read for free already: it stays free.']
  }
  if (pricing.access === 'paid') {
    const range = `Between XAF ${formatXaf(rules.minPrice)} and ${formatXaf(rules.maxPrice)}.`
    if (pricing.price === null) errors.price = ['Set the price.']
    else if (pricing.price < rules.minPrice || pricing.price > rules.maxPrice)
      errors.price = [range]
    if (pricing.studentPrice !== null) {
      if (pricing.studentPrice < rules.minPrice) {
        errors.studentPrice = [`At least XAF ${formatXaf(rules.minPrice)}.`]
      } else if (pricing.price !== null && pricing.studentPrice >= pricing.price) {
        errors.studentPrice = ['Below the price.']
      }
    }
    const months = pricing.freeAfterMonths
    if (months !== null && (!Number.isInteger(months) || months < 1 || months > 36)) {
      errors.freeAfterMonths = ['From 1 to 36 months.']
    }
  }
  return errors
}

export const TITLE_MAX = 160
export const SUMMARY_MAX = 800

/** Length limits, checked at each save; a draft may be incomplete. */
export function draftErrors(content: StoredContent): Errors {
  const errors: Errors = {}
  if (content.title.length > TITLE_MAX) errors.title = [`At most ${TITLE_MAX} characters.`]
  if (content.summary.length > SUMMARY_MAX) errors.summary = [`At most ${SUMMARY_MAX} characters.`]
  if (content.rating !== null && !ratingFits(content.subjectType, content.rating)) {
    errors.rating = ['Buy, Hold or Sell for a company; an outlook for a country.']
  }
  if (content.targetPrice !== null && !(content.targetPrice > 0)) {
    errors.targetPrice = ['A positive price.']
  }
  const horizon = content.horizonMonths
  if (horizon !== null && (!Number.isInteger(horizon) || horizon < 1 || horizon > 60)) {
    errors.horizonMonths = ['From 1 to 60 months.']
  }
  return errors
}

/**
 * Automatic checks of a submission (spec section 13): subject set, title, summary and body
 * written, a rating, every mandatory disclosure, a price within range.
 */
export function submissionErrors(
  content: StoredContent,
  pricing: PublicationPricingDto,
  rules: PublicationRulesDto,
  current: { access: PublicationAccess; readFree: boolean },
): Errors {
  const errors: Errors = { ...draftErrors(content) }
  const add = (field: string, message: string) => {
    errors[field] ??= [message]
  }
  if (!content.subjectId) add('subject', 'Choose the company or the country.')
  if (!content.title.trim()) add('title', 'Give a title.')
  if (!content.summary.trim()) add('summary', 'Write the summary readers see before purchase.')
  if (isDocEmpty(content.body)) add('body', 'Write the publication.')
  if (content.rating === null) {
    add('rating', content.subjectType === 'company' ? 'Choose a rating.' : 'Choose an outlook.')
  }
  if (content.subjectType === 'country' && !content.dataDate) {
    add('dataDate', 'Give the date of the data used.')
  }
  const { conflicts, disclaimer, sources } = content.disclosures
  if (!conflicts || !disclaimer || !sources) add('disclosures', 'Tick every mandatory disclosure.')
  return { ...errors, ...pricingErrors(pricing, rules, current) }
}

export interface LibraryFilter {
  subjectType?: SubjectType
  subjectId?: string
  country?: string
  sector?: string
  access?: PublicationAccess
  rating?: PublicationRating
  q?: string
  /** Followed analysts only. */
  analystIds?: ReadonlySet<string>
}

export function matchesLibraryFilter(item: LibraryItemDto, filter: LibraryFilter): boolean {
  const { subject } = item
  if (filter.subjectType && subject.type !== filter.subjectType) return false
  if (filter.subjectId && subject.id !== filter.subjectId) return false
  if (filter.country && subject.country !== filter.country) return false
  if (filter.sector && subject.sector !== filter.sector) return false
  if (filter.access && item.access !== filter.access) return false
  if (filter.rating && item.rating !== filter.rating) return false
  if (filter.analystIds && !filter.analystIds.has(item.analyst.id)) return false
  if (filter.q) {
    const haystack = normalize(
      [item.title, subject.code, subject.name, item.analyst.displayName].join(' '),
    )
    if (
      !normalize(filter.q)
        .split(/\s+/)
        .every((word) => haystack.includes(word))
    )
      return false
  }
  return true
}

const latestDate = (item: LibraryItemDto) => item.updatedAt ?? item.publishedAt

const SORTS: Record<LibrarySort, (a: LibraryItemDto, b: LibraryItemDto) => number> = {
  recent: (a, b) => latestDate(b).localeCompare(latestDate(a)),
  rating: (a, b) => (b.score ?? 0) - (a.score ?? 0) || b.scoreCount - a.scoreCount,
  reads: (a, b) => b.reads - a.reads,
  // Free first, then the cheapest.
  price: (a, b) =>
    (a.access === 'free' ? 0 : (a.price ?? 0)) - (b.access === 'free' ? 0 : (b.price ?? 0)),
}

/** Sorted copy; ties keep the most recent first. */
export function sortLibrary(items: readonly LibraryItemDto[], sort: LibrarySort): LibraryItemDto[] {
  return [...items].sort((a, b) => SORTS[sort](a, b) || SORTS.recent(a, b))
}

/** The monthly payout is made around this day of the next month. */
export const PAYOUT_DAY = 5

/** The day a month's payout is made: the 5th of the next month. */
export const paydayOf = (month: string): IsoDate =>
  `${addMonths(`${month}-01`, 1).slice(0, 7)}-0${PAYOUT_DAY}`

/** The months the Admin marked paid, with the day of the payment. */
export type PaidMonths = ReadonlyMap<string, IsoDate>

/**
 * Monthly statements, newest first: revenue less CMarket's commission. The current month accrues;
 * a closed month is due until the Admin marks it paid.
 */
export function payoutsOf(
  monthly: Record<string, MonthStats>,
  commissionPct: number,
  today: IsoDate,
  paid: PaidMonths,
): PayoutDto[] {
  const current = monthOf(today)
  return Object.entries(monthly)
    .filter(([month, stats]) => month <= current && stats.sales > 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, stats]) => {
      const commission = Math.round((stats.revenue * commissionPct) / 100)
      const paidAt = month === current ? null : (paid.get(month) ?? null)
      return {
        month,
        sales: stats.sales,
        revenue: stats.revenue,
        commission,
        net: stats.revenue - commission,
        status: month === current ? 'accruing' : paidAt ? 'paid' : 'due',
        paidAt,
      }
    })
}
