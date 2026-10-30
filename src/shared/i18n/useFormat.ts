import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatCompact,
  formatCountry,
  formatDate,
  formatDayMonth,
  formatFileSize,
  formatIsoDate,
  formatNumber,
  formatPercent,
  formatSigned,
  formatTime,
  MARKET_TIME_ZONE,
  type Locale,
} from '@/shared/lib/format'

export function useLocale(): Locale {
  const { i18n } = useTranslation()
  return i18n.resolvedLanguage === 'fr' ? 'fr' : 'en'
}

/** Formatters bound to the current language (numbers) and to Douala time (dates). */
export function useFormat() {
  const locale = useLocale()
  return useMemo(
    () => ({
      locale,
      number: (value: number, decimals = 2) => formatNumber(value, locale, decimals),
      signed: (value: number, decimals = 2, plusSign = true) =>
        formatSigned(value, locale, decimals, plusSign),
      percent: (value: number, decimals = 2, signed = true) =>
        formatPercent(value, locale, decimals, signed),
      compact: (value: number, decimals = 1) => formatCompact(value, locale, decimals),
      country: (code: string) => formatCountry(code, locale),
      fileSize: (bytes: number) => formatFileSize(bytes, locale),
      isoDate: (isoDate: string) => formatIsoDate(isoDate),
      date: (value: Date | string | number) => formatDate(value),
      dayMonth: (value: Date | string | number) => formatDayMonth(value),
      time: (value: Date | string | number, withSeconds = false) =>
        formatTime(value, MARKET_TIME_ZONE, withSeconds),
    }),
    [locale],
  )
}
