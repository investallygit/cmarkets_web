import type { CurrencyCode, IsoDate, IsoDateTime } from './common'
import type { PriceBarDto } from './securities'

/** A publication is about a listed company or a country as a sovereign issuer (spec section 13). */
export type SubjectType = 'company' | 'country'
export type Recommendation = 'buy' | 'hold' | 'sell'
export type Outlook = 'positive' | 'stable' | 'negative'
/** Buy / Hold / Sell on a company, an outlook on a country. */
export type PublicationRating = Recommendation | Outlook
export type PublicationAccess = 'free' | 'paid'
/** Draft, In moderation, Published, Archived (screen 7). */
export type PublicationStatus = 'draft' | 'pending' | 'published' | 'archived'

export interface PublicationSubjectDto {
  type: SubjectType
  /** The security's id for a company, the ISO country code for a country. */
  id: string
  /** SEMC, or the country code. */
  code: string
  name: string
  country: string
  /** A company's sector; null for a country. */
  sector: string | null
  /** Currency of a company's target price; null for a country. */
  currency: CurrencyCode | null
}

/** A node of a TipTap (ProseMirror) document in JSON. */
export interface RichTextNode {
  type: string
  attrs?: Record<string, unknown>
  content?: RichTextNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

/** The body of a publication: the JSON of the TipTap editor. */
export interface RichTextDoc {
  type: 'doc'
  content?: RichTextNode[]
}

export type FrozenChartPeriod = '1M' | '3M' | '6M' | '1Y' | '5Y'
export type FrozenChartType = 'line' | 'candles'

/**
 * A CMarket chart in a publication, with its data as of the day it was inserted. The body holds
 * a `cmarketChart` node with the chart's id.
 */
export interface FrozenChartDto {
  id: string
  securityId: string
  code: string
  title: string
  period: FrozenChartPeriod
  type: FrozenChartType
  currency: CurrencyCode
  frozenAt: IsoDate
  bars: PriceBarDto[]
}

/** POST /publications/{id}/charts */
export interface FrozenChartRequestDto {
  securityId: string
  period: FrozenChartPeriod
  type: FrozenChartType
  title: string
}

/** POST /publications/{id}/attachments: an image of the body, or the publication's PDF. */
export interface AttachmentDto {
  id: string
  fileName: string
  contentType: string
  size: number
  url: string
}

/** Mandatory disclosures, ticked by the analyst before submitting (spec section 13). */
export interface PublicationDisclosures {
  /** Conflicts of interest declared, e.g. no shares of the company held. */
  conflicts: boolean
  /** "Not personalized investment advice". */
  disclaimer: boolean
  /** Sources and dates of the data cited. */
  sources: boolean
}

/** PUT /publications/{id}/pricing; prices in XAF. */
export interface PublicationPricingDto {
  access: PublicationAccess
  price: number | null
  studentPrice: number | null
  /** A paid publication becomes free this many months after it was published. */
  freeAfterMonths: number | null
}

/** A published version; readers see the latest one. */
export interface PublicationVersionDto {
  number: number
  publishedAt: IsoDateTime
}

/** GET /me/publications: the analyst's own, newest change first. */
export interface MyPublicationDto {
  id: string
  title: string
  status: PublicationStatus
  subject: PublicationSubjectDto | null
  pricing: PublicationPricingDto
  publishedAt: IsoDateTime | null
  updatedAt: IsoDateTime
  /** Saved changes not yet published as a new version. */
  hasChanges: boolean
}

/** GET / PUT /publications/{id}: the analyst's working copy. */
export interface PublicationDto {
  id: string
  status: PublicationStatus
  subjectType: SubjectType
  subject: PublicationSubjectDto | null
  title: string
  summary: string
  body: RichTextDoc
  rating: PublicationRating | null
  targetPrice: number | null
  horizonMonths: number | null
  /** A company's close the rating refers to; set by the server, frozen on publication. */
  referenceDate: IsoDate | null
  referencePrice: number | null
  /** A country's: the date of the data used. */
  dataDate: IsoDate | null
  disclosures: PublicationDisclosures
  pricing: PublicationPricingDto
  /** The optional PDF. */
  attachment: AttachmentDto | null
  charts: FrozenChartDto[]
  /** Read for free at least once: it cannot become paid (spec section 13). */
  readFree: boolean
  versions: PublicationVersionDto[]
  hasChanges: boolean
  archiveReason: string | null
  savedAt: IsoDateTime
  /** Row version: a save made from an older one gets a 409. */
  version: number
}

/** POST /publications */
export interface PublicationCreateDto {
  subjectType: SubjectType
  subjectId: string
}

/** PUT /publications/{id}: the autosave of the editor. */
export interface PublicationUpdateDto {
  subjectType: SubjectType
  subjectId: string | null
  title: string
  summary: string
  body: RichTextDoc
  rating: PublicationRating | null
  targetPrice: number | null
  horizonMonths: number | null
  dataDate: IsoDate | null
  disclosures: PublicationDisclosures
  version: number
}

export interface PublicationPricingUpdateDto extends PublicationPricingDto {
  version: number
}

/** POST /publications/{id}/archive */
export interface PublicationArchiveDto {
  reason: string
}

/** GET /publications/rules: what the Admin set for publications. */
export interface PublicationRulesDto {
  currency: CurrencyCode
  minPrice: number
  maxPrice: number
  commissionPct: number
  /** Manual approval before publication, or review after it. */
  moderation: 'before' | 'after'
}

/** One publication's figures over the period. */
export interface PublicationStatsItemDto {
  publicationId: string
  title: string
  reads: number
  sales: number
  revenue: number
  score: number | null
  scoreCount: number
}

/** GET /me/publications/stats?from=&to= */
export interface PublicationStatsDto {
  from: IsoDate
  to: IsoDate
  items: PublicationStatsItemDto[]
  reads: number
  sales: number
  revenue: number
  commission: number
  /** Revenue less CMarket's commission. */
  net: number
  commissionPct: number
  /** Readers' ratings of all the analyst's publications. */
  score: number | null
  scoreCount: number
  followers: number
}

/** accruing: the current month; due: closed, not paid yet. */
export type PayoutStatus = 'accruing' | 'due' | 'paid'

/** GET /me/payouts: one statement a month. */
export interface PayoutDto {
  /** YYYY-MM */
  month: string
  sales: number
  revenue: number
  commission: number
  net: number
  status: PayoutStatus
  paidAt: IsoDate | null
}

export type LibrarySort = 'recent' | 'rating' | 'reads' | 'price'

/** GET /library and GET /me/purchases: one publication of the list. */
export interface LibraryItemDto {
  id: string
  title: string
  subject: PublicationSubjectDto
  analyst: { id: string; displayName: string }
  publishedAt: IsoDateTime
  /** The latest version's date, when updated since. */
  updatedAt: IsoDateTime | null
  access: PublicationAccess
  /** XAF; null when free. */
  price: number | null
  studentPrice: number | null
  rating: PublicationRating | null
  targetPrice: number | null
  /** Readers' average rating, 1 to 5. */
  score: number | null
  scoreCount: number
  reads: number
  status: PublicationStatus
  purchasedAt: IsoDateTime | null
  /** Opened by the user. */
  isRead: boolean
}

/** GET /library/{id}: the preview, and the full content when the user may read it. */
export interface LibraryPublicationDto extends LibraryItemDto {
  summary: string
  /** Table of contents: the section titles. */
  contents: string[]
  pages: number
  horizonMonths: number | null
  referenceDate: IsoDate | null
  referencePrice: number | null
  dataDate: IsoDate | null
  disclosures: PublicationDisclosures
  /** Free, bought, or written by the user. */
  hasAccess: boolean
  /** What the user would pay: the student price for a Student when offered; null when free. */
  priceToPay: number | null
  /** Paid, not bought, and the account may buy research. */
  canBuy: boolean
  body: RichTextDoc | null
  charts: FrozenChartDto[]
  attachment: { fileName: string; size: number } | null
  /** The version shown, and every version published. */
  version: number
  versions: PublicationVersionDto[]
  myRating: number | null
  canRate: boolean
  /** On bought content, shown over it and printed on the PDF (spec section 13). */
  watermark: { name: string; purchasedAt: IsoDateTime } | null
  isAuthor: boolean
}

export type PaymentMethod = 'mobileMoney' | 'card'

/** POST /library/{id}/purchase */
export interface PurchaseRequestDto {
  method: PaymentMethod
  /** The mobile money number to charge. */
  phone: string | null
}

export type PaymentStatus = 'pending' | 'confirmed' | 'failed'

/** GET /payments/{id}: asked again until confirmed or failed. */
export interface PaymentDto {
  id: string
  /** A publication of the library, or a subscription plan (CFG). */
  purpose: 'publication' | 'subscription'
  publicationId: string | null
  planId: string | null
  amount: number
  currency: CurrencyCode
  method: PaymentMethod
  status: PaymentStatus
  createdAt: IsoDateTime
  confirmedAt: IsoDateTime | null
  failureReason: string | null
}

/** POST /library/{id}/rating */
export interface RatingRequestDto {
  stars: number
}

export interface RatingResultDto {
  score: number | null
  scoreCount: number
  myRating: number
}

export type ContentReportReason = 'misleading' | 'conflict' | 'copyright' | 'other'

/** POST /library/{id}/report */
export interface ContentReportDto {
  reason: ContentReportReason
  comment: string
}

/** One Buy / Hold / Sell of an analyst against the price 12 months later. */
export interface AnalystRatingDto {
  publicationId: string
  title: string
  subjectCode: string
  publishedAt: IsoDate
  rating: Recommendation
  targetPrice: number | null
  referencePrice: number
  currency: CurrencyCode
  /** The close 12 months later, or the latest close for a rating not yet 12 months old. */
  priceAfter: number | null
  changePct: number | null
  outcome: 'confirmed' | 'missed' | 'open'
}

/** GET /analysts/{id}: the public profile. */
export interface AnalystDto {
  id: string
  displayName: string
  headline: string
  since: IsoDate
  publications: number
  score: number | null
  scoreCount: number
  followers: number
  isFollowed: boolean
  /** The user's own profile, which they cannot follow. */
  isSelf: boolean
  /** Share of the ratings at least 12 months old that the price confirmed. */
  confirmedPct: number | null
  ratings: AnalystRatingDto[]
}

/** POST / DELETE /analysts/{id}/follow */
export interface FollowResultDto {
  isFollowed: boolean
  followers: number
}
