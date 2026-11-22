import { useTranslation } from 'react-i18next'
import type { BondDto, MarketYieldDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useBondPricingStore } from '../model/bondPricingStore'
import type { PricingForm } from '../model/pricingForm'

/** Where the yield comes from (BS, a curve, none, the user), and the platform's to go back to. */
export function YieldSource({
  form,
  bond,
  market,
}: {
  form: PricingForm
  bond: BondDto
  market: MarketYieldDto | undefined
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const edit = useBondPricingStore((state) => state.edit)
  if (!form.bondId) return t('bondPricing.source.byHand')
  if (!market || market.ytmPct === null) return t('bondPricing.source.none')
  const date = market.asOf ? format.isoDate(market.asOf) : '—'
  const country = format.country(bond.country)
  if (form.ytm !== null && Math.abs(form.ytm - market.ytmPct) < 1e-9) {
    if (market.source === 'curve') {
      return t('bondPricing.source.curve', {
        country,
        spread:
          market.spreadBp === null
            ? ''
            : t('bondPricing.shift', { value: format.signed(market.spreadBp, 0) }),
        date,
      })
    }
    return market.priceSource === 'model'
      ? t('bondPricing.source.bsModel', { date })
      : t('bondPricing.source.bs', { date })
  }
  const platform = market.ytmPct
  return (
    <>
      {t('bondPricing.source.yours', {
        value: format.percent(platform, 4, false),
        source:
          market.source === 'curve'
            ? t('bondPricing.source.curveShort', { country })
            : t('bondPricing.source.bsShort'),
        date,
      })}{' '}
      <button
        type="button"
        onClick={() => edit({ ytm: platform })}
        className="inline-flex min-h-6 items-center text-info hover:underline"
      >
        {t('bondPricing.source.useIt')}
      </button>
    </>
  )
}
