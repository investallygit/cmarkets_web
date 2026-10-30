import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isCemacCountry } from '@/shared/config/countries'
import { useDisplayTimeZone } from '@/shared/lib/displayTimeZone'
import {
  formatCompact,
  formatCountry,
  formatDate,
  formatDayMonth,
  formatFileSize,
  formatIsoDate,
  formatMonth,
  formatNumber,
  formatPercent,
  formatSigned,
  formatTime,
  formatWeekday,
  type Locale,
} from '@/shared/lib/format'

export function useLocale(): Locale {
  const { i18n } = useTranslation()
  return i18n.resolvedLanguage === 'fr' ? 'fr' : 'en'
}

/**
 * Formatters bound to the current language (numbers) and to the user's time zone (dates and
 * times, Douala unless the profile says otherwise). A calendar day keeps its date everywhere.
 */
export function useFormat() {
  const { t } = useTranslation()
  const locale = useLocale()
  const timeZone = useDisplayTimeZone((state) => state.timeZone)
  return useMemo(
    () => ({
      locale,
      timeZone,
      number: (value: number, decimals = 2) => formatNumber(value, locale, decimals),
      signed: (value: number, decimals = 2, plusSign = true) =>
        formatSigned(value, locale, decimals, plusSign),
      percent: (value: number, decimals = 2, signed = true) =>
        formatPercent(value, locale, decimals, signed),
      compact: (value: number, decimals = 1) => formatCompact(value, locale, decimals),
      // The CEMAC countries have the short names of the mockups ("Eq. Guinea"); others come from Intl.
      country: (code: string) =>
        isCemacCountry(code) ? t(`countries.${code}`) : formatCountry(code, locale),
      fileSize: (bytes: number) => formatFileSize(bytes, locale),
      isoDate: (isoDate: string) => formatIsoDate(isoDate),
      weekday: (isoDate: string, style?: 'short' | 'long') => formatWeekday(isoDate, locale, style),
      month: (month: string) => formatMonth(month, locale),
      date: (value: Date | string | number) => formatDate(value, timeZone),
      dayMonth: (value: Date | string | number) => formatDayMonth(value, timeZone),
      time: (value: Date | string | number, withSeconds = false) =>
        formatTime(value, timeZone, withSeconds),
    }),
    [locale, t, timeZone],
  )
}
