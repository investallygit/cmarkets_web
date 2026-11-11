import type { ContentReportReason, NewsType } from '@/shared/api/contracts'

/** The limits of an item (spec section 16), as CMarket.Api checks them. */
export const NEWS_LIMITS = {
  headline: 150,
  standfirst: 400,
  flashText: 500,
  /** An ARTICLE's body: the characters of its text. */
  body: 10_000,
  securities: 10,
  author: 100,
  originalUrl: 500,
  withdrawalReason: 500,
  imageCredit: 120,
  /** JPEG or PNG with its credit. */
  imageBytes: 2 * 1024 * 1024,
  pdfBytes: 10 * 1024 * 1024,
  /** A CSV or an XLSX alone; a ZIP holds its images and PDFs too. */
  tableBytes: 10 * 1024 * 1024,
  zipBytes: 50 * 1024 * 1024,
} as const

/** What a reader reports an item for: those of a publication (spec section 13). */
export const NEWS_REPORT_REASONS: readonly ContentReportReason[] = [
  'misleading',
  'conflict',
  'copyright',
  'other',
]

/** An ARTICLE's standfirst has 400 characters, a FLASH's text 500. */
export function summaryLimit(type: NewsType): number {
  return type === 'flash' ? NEWS_LIMITS.flashText : NEWS_LIMITS.standfirst
}
