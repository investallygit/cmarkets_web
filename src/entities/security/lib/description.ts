import type { DescriptionSource, SecurityDescriptionDto } from '@/shared/api/contracts'

export type DescriptionLanguage = 'fr' | 'en'

export const DESCRIPTION_LANGUAGES: readonly DescriptionLanguage[] = ['fr', 'en']

/** The text a screen shows of a security's description. */
export interface ShownDescription {
  language: DescriptionLanguage
  text: string
  source: DescriptionSource
  /**
   * The languages written, in the order of the tabs: a choice when there are two; one alone, the
   * panel marks it (ROADMAP decision 9).
   */
  languages: DescriptionLanguage[]
}

/**
 * EQS's description (spec section 9, screen 3): in the language wanted (the reader's choice, else
 * the screen's) when it has a text, else in the other one; none when neither has one.
 */
export function shownDescription(
  description: SecurityDescriptionDto | undefined,
  wanted: DescriptionLanguage,
): ShownDescription | null {
  if (!description) return null
  const languages = DESCRIPTION_LANGUAGES.filter((language) => description[language] !== null)
  const language = languages.includes(wanted) ? wanted : languages[0]
  const written = language ? description[language] : null
  if (!language || !written) return null
  return { language, text: written.text, source: written.source, languages }
}
