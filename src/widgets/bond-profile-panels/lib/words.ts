import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondLabels } from '@/entities/bond'
import type { BondDto, BondOptionDto, CouponType } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

type Frequency = 'annual' | 'semiAnnual' | 'quarterly' | 'monthly'

/** Coupons a year to the words of the bond list. */
const FREQUENCIES: Record<number, Frequency> = {
  1: 'annual',
  2: 'semiAnnual',
  4: 'quarterly',
  12: 'monthly',
}

export const DASH = '—'

/** The words of a bond on screen 20, in the user's language. */
export function useBondWords() {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useBondLabels()
  return useMemo(() => {
    const frequencyOf = (frequency: number): Frequency | undefined => FREQUENCIES[frequency]
    const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

    /** "Annual fixed coupon", "Zero coupon". */
    const couponLine = (type: CouponType, frequency: number) => {
      const key = frequencyOf(frequency)
      if (type === 'zero' || !key) return t('bondProfile.zeroCoupon')
      return capitalized(
        t(`bondProfile.couponLines.${key}`, {
          type: t(`bondScreener.couponTypes.${type}`).toLowerCase(),
        }),
      )
    }

    /** "Callable on 30/06/2027 at 101.00"; the first of several dates; "None". */
    const options = (calls: readonly BondOptionDto[], puts: readonly BondOptionDto[]) => {
      const words = (
        list: readonly BondOptionDto[],
        one: 'call' | 'put',
        many: 'calls' | 'puts',
      ) => {
        const first = list.at(0)
        if (!first) return null
        const values = { date: format.isoDate(first.date), price: format.number(first.price, 2) }
        return list.length === 1
          ? t(`bondProfile.characteristics.${one}`, values)
          : t(`bondProfile.characteristics.${many}`, { ...values, count: list.length })
      }
      const all = [words(calls, 'call', 'calls'), words(puts, 'put', 'puts')].filter(Boolean)
      return all.length > 0 ? all.join(' · ') : t('bondProfile.characteristics.none')
    }

    return {
      /** "Annual", for the frequency and day count line. */
      frequency: (frequency: number) => {
        const key = frequencyOf(frequency)
        return key ? t(`bondScreener.frequencies.${key}`) : String(frequency)
      },
      couponLine,
      options,
      /** The header's line: category, market, currency, coupon, redemption, seniority. */
      description: (bond: BondDto) =>
        [
          t(`bondProfile.categories.${bond.issuerCategory}`),
          labels.market(bond.market),
          bond.currency,
          couponLine(bond.couponType, bond.frequency),
          t(`bondProfile.redemptions.${bond.amortization === 'bullet' ? 'bullet' : 'amortizing'}`),
          t(`bondScreener.seniorities.${bond.seniority}`),
        ].join(' · '),
      /** "Sovereign · Government", "Corporate · Industrials", "Supranational". */
      categorySector: (bond: BondDto) => {
        const category = t(`bondScreener.categories.${bond.issuerCategory}`)
        const sector = bond.sector
          ? t(`bondScreener.sectors.${bond.sector}`)
          : bond.issuerCategory === 'sovereign' || bond.issuerCategory === 'municipal'
            ? t(`bondProfile.characteristics.sectors.${bond.issuerCategory}`)
            : null
        return sector ? `${category} · ${sector}` : category
      },
      /** "6.25% · fixed"; "Zero"; a floating coupon with its index and margin. */
      coupon: (bond: BondDto) => {
        if (bond.couponType === 'zero') return t('bondScreener.couponTypes.zero')
        const rate = format.percent(bond.couponPct, 2, false)
        return bond.couponType === 'float' && bond.floatIndex
          ? t('bondScreener.floating', {
              rate,
              index: bond.floatIndex,
              margin: format.percent(bond.floatMarginPct ?? 0, 2, true),
            })
          : `${rate} · ${t(`bondScreener.couponTypes.${bond.couponType}`).toLowerCase()}`
      },
      /** "Bullet, at par", "Amortizing, in equal parts". */
      redemption: (bond: BondDto) =>
        t(`bondProfile.characteristics.redemptions.${bond.amortization}`),
      /** "+12 bp", "0 bp", "—". */
      spread: (spreadBp: number | null) =>
        spreadBp === null ? DASH : t('bondScreener.bp', { value: labels.spread(spreadBp) }),
      price: (value: number | null) => (value === null ? DASH : format.number(value, 2)),
      percent: (value: number | null) => (value === null ? DASH : format.percent(value, 2, false)),
    }
  }, [t, format, labels])
}
