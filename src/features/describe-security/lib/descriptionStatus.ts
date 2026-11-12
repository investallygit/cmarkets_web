import type { StoredDescriptionDto } from '@/shared/api/contracts'

/** A description's text at most, as the API counts it once tidied (spec section 9, screen 3). */
export const DESCRIPTION_MAX_LENGTH = 2_000

/** What EQS shows of a language the Data admin left empty (ROADMAP decision 9). */
export type EmptyLanguageView = 'eodhd' | 'other' | 'none'

/**
 * A language without the Data admin's text: EODHD's English where there is one, else the other
 * language's text, marked, else nothing.
 */
export function emptyLanguageView(
  stored: StoredDescriptionDto,
  language: 'fr' | 'en',
  texts: Record<'fr' | 'en', string>,
): EmptyLanguageView {
  if (language === 'en' && stored.eodhd) return 'eodhd'
  const other = language === 'fr' ? 'en' : 'fr'
  if (texts[other].trim() !== '' || (other === 'en' && stored.eodhd)) return 'other'
  return 'none'
}
