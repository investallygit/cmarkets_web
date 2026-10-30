import type {
  LibraryPublicationDto,
  PublicationAccess,
  PublicationDisclosures,
  PublicationDto,
  PublicationPricingDto,
  PublicationPricingUpdateDto,
  PublicationRating,
  PublicationRulesDto,
  PublicationUpdateDto,
  RichTextDoc,
  SubjectType,
} from '@/shared/api/contracts'
import { docHeadings, estimatePages, isDocEmpty } from '@/shared/lib/richText'

export const TITLE_MAX = 160
export const SUMMARY_MAX = 800
export const MAX_FREE_AFTER_MONTHS = 36
export const MAX_HORIZON_MONTHS = 60

/** What the editor and the settings change; saved by PUT /publications/{id}. */
export interface DraftForm {
  subjectType: SubjectType
  subjectId: string | null
  /** SEMC, or the country code: for the labels, not sent. */
  subjectCode: string | null
  title: string
  summary: string
  body: RichTextDoc
  rating: PublicationRating | null
  targetPrice: number | null
  horizonMonths: number | null
  dataDate: string | null
  disclosures: PublicationDisclosures
}

/** Saved by PUT /publications/{id}/pricing. */
export type PricingForm = PublicationPricingDto

export function toDraftForm(publication: PublicationDto): DraftForm {
  return {
    subjectType: publication.subjectType,
    subjectId: publication.subject?.id ?? null,
    subjectCode: publication.subject?.code ?? null,
    title: publication.title,
    summary: publication.summary,
    body: publication.body,
    rating: publication.rating,
    targetPrice: publication.targetPrice,
    horizonMonths: publication.horizonMonths,
    dataDate: publication.dataDate,
    disclosures: { ...publication.disclosures },
  }
}

export function toUpdateDto(form: DraftForm, version: number): PublicationUpdateDto {
  const company = form.subjectType === 'company'
  return {
    subjectType: form.subjectType,
    subjectId: form.subjectId,
    title: form.title,
    summary: form.summary,
    body: form.body,
    rating: form.rating,
    targetPrice: company ? form.targetPrice : null,
    horizonMonths: company ? form.horizonMonths : null,
    dataDate: company ? null : form.dataDate,
    disclosures: form.disclosures,
    version,
  }
}

export function toPricingDto(pricing: PricingForm, version: number): PublicationPricingUpdateDto {
  return pricing.access === 'free'
    ? { access: 'free', price: null, studentPrice: null, freeAfterMonths: null, version }
    : { ...pricing, version }
}

/** The messages of the checks, under studio.errors. */
export type IssueKey =
  | 'subjectRequired'
  | 'titleRequired'
  | 'titleLength'
  | 'summaryRequired'
  | 'summaryLength'
  | 'bodyRequired'
  | 'ratingRequired'
  | 'outlookRequired'
  | 'dataDateRequired'
  | 'disclosuresRequired'
  | 'positive'
  | 'horizonRange'
  | 'readFree'
  | 'priceRequired'
  | 'priceRange'
  | 'studentMin'
  | 'studentBelow'
  | 'freeAfterRange'

/** A field and the message of its check. */
export type Issues = Partial<Record<string, IssueKey>>

export const hasIssues = (issues: Issues) => Object.keys(issues).length > 0

export const allDisclosed = ({ conflicts, disclaimer, sources }: PublicationDisclosures) =>
  conflicts && disclaimer && sources

/** The server's access rule: a publication read for free stays free (spec section 13). */
export function pricingIssues(
  pricing: PricingForm,
  rules: PublicationRulesDto,
  current: { access: PublicationAccess; readFree: boolean },
): Issues {
  const issues: Issues = {}
  if (pricing.access === 'free') return issues
  if (current.access === 'free' && current.readFree) issues.access = 'readFree'
  if (pricing.price === null) issues.price = 'priceRequired'
  else if (pricing.price < rules.minPrice || pricing.price > rules.maxPrice) {
    issues.price = 'priceRange'
  }
  if (pricing.studentPrice !== null) {
    if (pricing.studentPrice < rules.minPrice) issues.studentPrice = 'studentMin'
    else if (pricing.price !== null && pricing.studentPrice >= pricing.price) {
      issues.studentPrice = 'studentBelow'
    }
  }
  const months = pricing.freeAfterMonths
  if (
    months !== null &&
    (!Number.isInteger(months) || months < 1 || months > MAX_FREE_AFTER_MONTHS)
  ) {
    issues.freeAfterMonths = 'freeAfterRange'
  }
  return issues
}

/** Limits checked at every save. */
export function contentIssues(form: DraftForm): Issues {
  const issues: Issues = {}
  if (form.title.length > TITLE_MAX) issues.title = 'titleLength'
  if (form.summary.length > SUMMARY_MAX) issues.summary = 'summaryLength'
  if (form.subjectType === 'company') {
    if (form.targetPrice !== null && !(form.targetPrice > 0)) issues.targetPrice = 'positive'
    const horizon = form.horizonMonths
    if (
      horizon !== null &&
      (!Number.isInteger(horizon) || horizon < 1 || horizon > MAX_HORIZON_MONTHS)
    ) {
      issues.horizonMonths = 'horizonRange'
    }
  }
  return issues
}

/** The checks of a submission on what the editor and the rating hold (spec section 13). */
export function contentSubmissionIssues(form: DraftForm): Issues {
  const issues: Issues = {}
  if (!form.subjectId) issues.subject = 'subjectRequired'
  if (!form.title.trim()) issues.title = 'titleRequired'
  if (!form.summary.trim()) issues.summary = 'summaryRequired'
  if (isDocEmpty(form.body)) issues.body = 'bodyRequired'
  if (form.rating === null) {
    issues.rating = form.subjectType === 'company' ? 'ratingRequired' : 'outlookRequired'
  }
  if (form.subjectType === 'country' && !form.dataDate) issues.dataDate = 'dataDateRequired'
  if (!allDisclosed(form.disclosures)) issues.disclosures = 'disclosuresRequired'
  return { ...issues, ...contentIssues(form) }
}

/** The automatic checks of a submission, as the server runs them. */
export function submissionIssues(
  form: DraftForm,
  pricing: PricingForm,
  rules: PublicationRulesDto,
  current: { access: PublicationAccess; readFree: boolean },
): Issues {
  return { ...contentSubmissionIssues(form), ...pricingIssues(pricing, rules, current) }
}

/**
 * The draft as its readers will see it (spec section 13: "preview exactly as the reader will
 * see it"): locked before purchase, or the whole text with the buyer's watermark.
 */
export function readerPreview(
  publication: PublicationDto,
  form: DraftForm,
  pricing: PricingForm,
  author: { id: string; displayName: string },
  unlocked: boolean,
  now: string,
): LibraryPublicationDto {
  const saved = publication.subject
  const subject =
    saved && saved.id === form.subjectId
      ? saved
      : {
          type: form.subjectType,
          id: form.subjectId ?? '',
          code: form.subjectCode ?? '',
          name: form.subjectCode ?? '',
          country: form.subjectType === 'country' ? (form.subjectId ?? '') : '',
          sector: null,
          currency: form.subjectType === 'company' ? 'XAF' : null,
        }
  const paid = pricing.access === 'paid'
  const company = form.subjectType === 'company'
  // Published already: the preview is of the next version.
  const versions = [
    ...publication.versions,
    { number: publication.versions.length + 1, publishedAt: now },
  ]
  return {
    id: publication.id,
    title: form.title,
    subject,
    analyst: author,
    publishedAt: publication.versions.at(0)?.publishedAt ?? now,
    updatedAt: publication.versions.length > 0 ? now : null,
    access: pricing.access,
    price: paid ? pricing.price : null,
    studentPrice: paid ? pricing.studentPrice : null,
    rating: form.rating,
    targetPrice: company ? form.targetPrice : null,
    score: null,
    scoreCount: 0,
    reads: 0,
    status: 'published',
    purchasedAt: null,
    isRead: false,
    summary: form.summary,
    contents: docHeadings(form.body),
    pages: estimatePages(form.summary, form.body),
    horizonMonths: company ? form.horizonMonths : null,
    referenceDate: company ? publication.referenceDate : null,
    referencePrice: company ? publication.referencePrice : null,
    dataDate: company ? null : form.dataDate,
    disclosures: form.disclosures,
    hasAccess: unlocked,
    priceToPay: paid ? pricing.price : null,
    canBuy: false,
    body: unlocked ? form.body : null,
    charts: publication.charts,
    attachment: publication.attachment && {
      fileName: publication.attachment.fileName,
      size: publication.attachment.size,
    },
    version: publication.versions.length + 1,
    versions,
    myRating: null,
    canRate: false,
    watermark: unlocked && paid ? { name: author.displayName, purchasedAt: now } : null,
    isAuthor: false,
  }
}
