import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { FxCurrencyDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'

/**
 * A currency's name in the user's language, with the units its XAF value is quoted for when not
 * one: "Yen (per 100)", as the screen 26 mockup writes it.
 */
export function useCurrencyName() {
  const { t } = useTranslation()
  const locale = useLocale()
  return useCallback(
    (currency: Pick<FxCurrencyDto, 'nameEn' | 'nameFr' | 'unit'>) => {
      const name = locale === 'fr' ? currency.nameFr : currency.nameEn
      return currency.unit === 1 ? name : t('fx.perHundred', { name, unit: currency.unit })
    },
    [locale, t],
  )
}
