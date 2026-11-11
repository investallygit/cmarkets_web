import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { BondIssuerCategory, BondMarket, CouponType } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

/** A yield to worst other than the yield to maturity, shown in yellow: a call is worse for the investor. */
export const ytwDiffers = (figures: { ytmPct: number | null; ytwPct: number | null }) =>
  figures.ytwPct !== null &&
  figures.ytmPct !== null &&
  Math.abs(figures.ytwPct - figures.ytmPct) >= 0.005

/** A supranational or regional issuer has no country of its own on screen 17: "Supranational". */
const WITHOUT_COUNTRY: ReadonlySet<BondIssuerCategory> = new Set(['supranational', 'regional'])

/** The words and figures of a bond on BS (screen 17), in the user's language. */
export function useBondLabels() {
  const { t } = useTranslation()
  const format = useFormat()
  return useMemo(
    () => ({
      /** "Sovereign · CM", "Supranational", "Corporate · CM". */
      issuer: (category: BondIssuerCategory, country: string) =>
        WITHOUT_COUNTRY.has(category)
          ? t(`bondScreener.categories.${category}`)
          : `${t(`bondScreener.categories.${category}`)} · ${country}`,
      market: (market: BondMarket) => t(`bondScreener.markets.${market}`),
      /** "6.25", or "Zero" for a zero coupon. */
      coupon: (type: CouponType, couponPct: number) =>
        type === 'zero' ? t('bondScreener.couponTypes.zero') : format.number(couponPct, 2),
      /** The composite rating, "NR" when not rated. */
      rating: (rating: string | null) => rating ?? t('bondScreener.notRated'),
      /** "+75", "0", "−43"; "—" without a reference curve. */
      spread: (spreadBp: number | null) =>
        spreadBp === null ? '—' : spreadBp === 0 ? '0' : format.signed(spreadBp, 0),
    }),
    [t, format],
  )
}
