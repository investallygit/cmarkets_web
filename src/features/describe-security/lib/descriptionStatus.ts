import type { DescriptionVersionDto, DescriptionVersionsDto } from '@/shared/api/contracts'

/** A description's text at most, as the API counts it once tidied (spec section 9, screen 2). */
export const DESCRIPTION_MAX_LENGTH = 1_500

/** What a source cites at most ("Issuer's 2025 annual report"). */
export const DESCRIPTION_SOURCE_MAX_LENGTH = 200

/** What the screens show of a language CMarket left empty (ROADMAP decision 9). */
export type EmptyLanguageView = 'eodhd' | 'other' | 'none'

/** The latest version of a language, the one the screens show when it has a text. */
export function latestVersion(
  versions: DescriptionVersionsDto,
  language: 'fr' | 'en',
): DescriptionVersionDto | null {
  return versions[language][0] ?? null
}

/**
 * A language without CMarket's text: EODHD's English where there is one, else the other
 * language's text, marked, else nothing.
 */
export function emptyLanguageView(
  versions: DescriptionVersionsDto,
  language: 'fr' | 'en',
  texts: Record<'fr' | 'en', string>,
): EmptyLanguageView {
  if (language === 'en' && versions.eodhd) return 'eodhd'
  const other = language === 'fr' ? 'en' : 'fr'
  if (texts[other].trim() !== '' || (other === 'en' && versions.eodhd)) return 'other'
  return 'none'
}

/** Whether a language's text or source differs from its latest version, as the API compares them. */
export function languageChanged(
  latest: DescriptionVersionDto | null,
  text: string,
  source: string,
): boolean {
  const written = latest?.text ?? ''
  if (text.trim() !== written) return true
  return text.trim() !== '' && source.trim() !== (latest?.source ?? '')
}
