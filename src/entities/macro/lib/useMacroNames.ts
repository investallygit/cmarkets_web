import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MacroCountryDto, MacroUnit } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'

interface Named {
  nameEn: string
  nameFr: string
}

/**
 * The names of screen 25 in the user's language: an economy's (short in the selector and the
 * table: "CAR", "Sub-Saharan Afr."), an indicator's, and an indicator's with its unit, as a row
 * or a chart's title writes it: "GDP growth (%)", "Population (M)".
 */
export function useMacroNames() {
  const { t } = useTranslation()
  const locale = useLocale()
  const name = useCallback((item: Named) => (locale === 'fr' ? item.nameFr : item.nameEn), [locale])
  const economy = useCallback(
    (country: MacroCountryDto, short = false) =>
      short ? (locale === 'fr' ? country.shortNameFr : country.shortNameEn) : name(country),
    [locale, name],
  )
  const withUnit = useCallback(
    (indicator: Named & { unit: MacroUnit }) => {
      const unit = t(`eco.units.${indicator.unit}`)
      return unit ? `${name(indicator)} (${unit})` : name(indicator)
    },
    [name, t],
  )
  return useMemo(() => ({ name, economy, withUnit }), [name, economy, withUnit])
}
