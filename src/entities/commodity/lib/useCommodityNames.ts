import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CommodityFrequency, CommodityUnit } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'

interface Named {
  nameEn: string
  nameFr: string
  shortNameEn: string
  shortNameFr: string
}

/**
 * The words of screen 21 in the user's language: a commodity's name (its short one in the list:
 * "Henry Hub nat. gas"), its unit ("USD per barrel"), its frequency ("Daily").
 */
export function useCommodityNames() {
  const { t } = useTranslation()
  const locale = useLocale()
  const name = useCallback(
    (item: Named, short = false) =>
      short
        ? locale === 'fr'
          ? item.shortNameFr
          : item.shortNameEn
        : locale === 'fr'
          ? item.nameFr
          : item.nameEn,
    [locale],
  )
  const unit = useCallback((code: CommodityUnit) => t(`commodities.units.${code}`), [t])
  const frequency = useCallback(
    (code: CommodityFrequency) => t(`commodities.frequencies.${code}`),
    [t],
  )
  /** Who publishes it: the catalogue's in the user's language, a file's source as written. */
  const source = useCallback(
    (item: { primarySourceEn: string; primarySourceFr: string }) =>
      locale === 'fr' ? item.primarySourceFr : item.primarySourceEn,
    [locale],
  )
  return useMemo(() => ({ name, unit, frequency, source }), [name, unit, frequency, source])
}
