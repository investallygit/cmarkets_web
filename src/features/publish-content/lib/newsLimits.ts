import type { NewsType } from '@/shared/api/contracts'

/** The limits of an item (spec section 16), as CMarket.Api checks them. */
export const NEWS_LIMITS = {
  headline: 150,
  standfirst: 400,
  flashText: 500,
  body: 10_000,
  securities: 10,
} as const

/** An ARTICLE's standfirst has 400 characters, a FLASH's text 500. */
export function summaryLimit(type: NewsType): number {
  return type === 'flash' ? NEWS_LIMITS.flashText : NEWS_LIMITS.standfirst
}

/** Paragraphs separated by an empty line, trimmed, the empty ones left out. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
