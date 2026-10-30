export type Locale = 'fr' | 'en'

/** The session clock and market dates use Douala time (spec section 8). */
export const MARKET_TIME_ZONE = 'Africa/Douala'

const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' }
const NBSP = '\u00a0'

const numberFormats = new Map<string, Intl.NumberFormat>()

function getNumberFormat(locale: Locale, decimals: number): Intl.NumberFormat {
  const key = `${locale}|${decimals}`
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(INTL_LOCALE[locale], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    numberFormats.set(key, format)
  }
  return format
}

/** 52 500,25 in French, 52,500.25 in English (spec section 8). */
export function formatNumber(value: number, locale: Locale, decimals = 2): string {
  // French ICU data groups digits with a narrow no-break space, which the mono font may lack.
  return getNumberFormat(locale, decimals)
    .format(value)
    .replace(/\u202f/g, NBSP)
}

/** Changes with an explicit sign: +0.42, -3.42, 0.00. */
export function formatSigned(value: number, locale: Locale, decimals = 2, plusSign = true): string {
  const rounded = Number(value.toFixed(decimals))
  const text = formatNumber(Math.abs(rounded), locale, decimals)
  if (rounded > 0) return plusSign ? `+${text}` : text
  if (rounded < 0) return `-${text}`
  return text
}

export function formatPercent(value: number, locale: Locale, decimals = 2, signed = true): string {
  const text = signed
    ? formatSigned(value, locale, decimals)
    : formatNumber(value, locale, decimals)
  return locale === 'fr' ? `${text}${NBSP}%` : `${text}%`
}

const COMPACT_UNITS: Record<Locale, readonly (readonly [number, string])[]> = {
  en: [
    [1e9, 'Bn'],
    [1e6, 'M'],
    [1e3, 'K'],
  ],
  fr: [
    [1e9, 'Md'],
    [1e6, 'M'],
    [1e3, 'k'],
  ],
}

/** Large amounts such as "148.2 M". */
export function formatCompact(value: number, locale: Locale, decimals = 1): string {
  for (const [size, unit] of COMPACT_UNITS[locale]) {
    if (Math.abs(value) >= size)
      return `${formatNumber(value / size, locale, decimals)}${NBSP}${unit}`
  }
  return formatNumber(value, locale, 0)
}

const countryNames = new Map<Locale, Intl.DisplayNames>()

/** "CM" -> "Cameroon" in English, "Cameroun" in French. */
export function formatCountry(code: string, locale: Locale): string {
  let names = countryNames.get(locale)
  if (!names) {
    names = new Intl.DisplayNames([INTL_LOCALE[locale]], { type: 'region' })
    countryNames.set(locale, names)
  }
  try {
    return names.of(code) ?? code
  } catch {
    return code
  }
}

const FILE_SIZE_UNITS: Record<Locale, readonly string[]> = {
  en: ['B', 'KB', 'MB', 'GB'],
  fr: ['o', 'Ko', 'Mo', 'Go'],
}

/** File sizes such as "1.2 MB" ("1,2 Mo" in French). */
export function formatFileSize(bytes: number, locale: Locale): string {
  const units = FILE_SIZE_UNITS[locale]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${formatNumber(size, locale, unit === 0 ? 0 : 1)}${NBSP}${units[unit]}`
}

type DateInput = Date | string | number

interface DateTimeParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>()

function getParts(date: DateInput, timeZone: string): DateTimeParts {
  let format = dateTimeFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    dateTimeFormats.set(timeZone, format)
  }
  const parts = format.formatToParts(date instanceof Date ? date : new Date(date))
  return Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  ) as unknown as DateTimeParts
}

/** DD/MM/YYYY in both languages (spec section 8). */
export function formatDate(date: DateInput, timeZone = MARKET_TIME_ZONE): string {
  const { day, month, year } = getParts(date, timeZone)
  return `${day}/${month}/${year}`
}

const weekdayFormats = new Map<string, Intl.DateTimeFormat>()

/** Day of the week of a calendar date: "Mon" / "lun." (short), "Monday" / "lundi" (long). */
export function formatWeekday(
  isoDate: string,
  locale: Locale,
  style: 'short' | 'long' = 'short',
): string {
  const key = `${locale}|${style}`
  let format = weekdayFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: style, timeZone: 'UTC' })
    weekdayFormats.set(key, format)
  }
  return format.format(new Date(`${isoDate}T12:00:00Z`))
}

/** A calendar date such as "2026-10-30" as DD/MM/YYYY, with no time zone conversion. */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatDayMonth(date: DateInput, timeZone = MARKET_TIME_ZONE): string {
  const { day, month } = getParts(date, timeZone)
  return `${day}/${month}`
}

export function formatTime(
  date: DateInput,
  timeZone = MARKET_TIME_ZONE,
  withSeconds = false,
): string {
  const { hour, minute, second } = getParts(date, timeZone)
  return withSeconds ? `${hour}:${minute}:${second}` : `${hour}:${minute}`
}

/** Calendar day in the market time zone, e.g. "2026-10-29". */
export function toMarketDay(date: DateInput, timeZone = MARKET_TIME_ZONE): string {
  const { year, month, day } = getParts(date, timeZone)
  return `${year}-${month}-${day}`
}
