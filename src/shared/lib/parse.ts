import type { Locale } from './format'

/** Also matches the no-break spaces that group digits in French. */
const SPACES = /\s/g
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/
const ENGLISH_GROUPS = /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/

/**
 * Number typed by the user in the format of their language (spec section 8): "52 500,25" in
 * French, "52,500.25" in English. French also accepts a decimal point, as typed on a keypad.
 * Returns null when the text is not a number, e.g. "1,5" in English.
 */
export function parseNumber(text: string, locale: Locale): number | null {
  let value = text.replace(SPACES, '')
  if (locale === 'fr') value = value.replace(',', '.')
  else if (ENGLISH_GROUPS.test(value)) value = value.replaceAll(',', '')
  return PLAIN_NUMBER.test(value) ? Number(value) : null
}

const DAY_MONTH_YEAR = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/

/**
 * Date typed as DD/MM/YYYY (spec section 8), returned as an ISO calendar date such as
 * "2026-10-30". Returns null when the text is not a real date, e.g. 31/02/2026.
 */
export function parseDate(text: string): string | null {
  const match = DAY_MONTH_YEAR.exec(text.trim())
  if (!match) return null
  const [day, month, year] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) return null
  if (date.getUTCDate() !== day) return null
  return date.toISOString().slice(0, 10)
}
