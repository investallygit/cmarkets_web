import { useTranslation } from 'react-i18next'
import { cmarketCurveId, useBondPrice, useCurve, useCurves } from '@/entities/bond'
import type { CurveSummaryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useBondPricingStore } from './bondPricingStore'
import {
  pointsToSave,
  shownRates,
  switchDiscount,
  type DiscountChoice,
  type DiscountForm,
  type RateEntry,
  type ScheduleRow,
} from './discountForm'
import { scheduleRequest, type PricingForm } from './pricingForm'
import { referenceOf, referenceRates } from './rateEntry'

/**
 * The bond's remaining cash-flow dates, for block B's table and the rates entered by date; null
 * while they load or the bond is incomplete. Block B and the entry panel read the same query.
 */
export function useScheduleRows(form: PricingForm | null): readonly ScheduleRow[] | null {
  const request = form ? scheduleRequest(form) : null
  const schedule = useBondPrice(request)
  return request && schedule.data && !schedule.isPlaceholderData
    ? schedule.data.cashFlows.map(({ date, years }) => ({ date, years }))
    : null
}

/**
 * What block B and the entry panel of screen 16 both read (ROADMAP decisions 46 and 56): the
 * curves of the bond's country, the curve chosen, the rate each cash-flow date shows, the
 * reference curve and its rate at each date and tenor; and the changes they make to block B.
 */
export function useDiscountRates(form: PricingForm, rows: readonly ScheduleRow[] | null) {
  const { t } = useTranslation()
  const format = useFormat()
  const edit = useBondPricingStore((state) => state.edit)
  const submitted = useBondPricingStore((state) => state.submitted)
  const priced = useBondPrice(submitted)
  const { discount } = form

  const cmarketId = cmarketCurveId(form.country)
  const curveId = discount.mode === 'curve' ? (discount.curveId ?? cmarketId) : null
  const curves = useCurves(form.country, discount.mode !== 'yield')
  // CMarket's curve on the settlement date: the tenors start from it, a curve saved takes its date.
  const cmarket = useCurve(cmarketId, form.settlementDate)
  const chosen = useCurve(curveId === cmarketId ? null : curveId)
  const curve = curveId === cmarketId ? cmarket.data : chosen.data
  // The yield of the clean price entered is the last calculation's.
  const pricedYield = submitted?.cleanPrice !== undefined && priced.data ? priced.data.ytmPct : null
  const ytm = discount.byPrice ? pricedYield : form.ytm
  const allRows = rows ?? []
  const shown = shownRates(discount, allRows, { ytm, curve: curve?.points ?? null })

  const setDiscount = (next: DiscountForm) => edit({ discount: next })
  const switchTo = (change: { mode: DiscountChoice; entry?: RateEntry }) =>
    setDiscount(
      switchDiscount(discount, change, {
        rows: allRows,
        shown,
        curve: curve?.points ?? cmarket.data?.points ?? null,
      }),
    )

  const curveLabel = (item: CurveSummaryDto) =>
    item.kind === 'cmarket'
      ? t('bondPricing.curves.cmarket', {
          country: format.country(item.country ?? form.country),
          date: format.isoDate(item.date),
        })
      : item.mine
        ? t('bondPricing.curves.custom', { name: item.name, date: format.isoDate(item.date) })
        : t('bondPricing.curves.ofColleague', {
            name: item.name,
            date: format.isoDate(item.date),
            owner: item.owner ?? '—',
          })
  const curveOptions = (curves.data ?? []).map((item) => ({
    value: item.id,
    label: curveLabel(item),
  }))
  if (curveId && !curveOptions.some((option) => option.value === curveId)) {
    curveOptions.unshift({
      value: curveId,
      label: curve
        ? curveLabel(curve)
        : t('bondPricing.curves.cmarketOf', { country: format.country(form.country) }),
    })
  }

  // Decision 46: each row beside the reference curve (the curve chosen, the one the rates started
  // from, else CMarket's) and the spread to it.
  const referenceId = referenceOf(discount, cmarketId)
  const otherReference = useCurve(
    discount.mode === 'rates' && referenceId !== cmarketId ? referenceId : null,
  )
  const reference =
    referenceId === curveId ? curve : referenceId === cmarketId ? cmarket.data : otherReference.data
  const references =
    discount.mode === 'yield' ? null : referenceRates(reference?.points ?? null, allRows)

  return {
    discount,
    rows: allRows,
    shown,
    ytm,
    pricedYield,
    cmarketId,
    curveId,
    curves,
    curve,
    summary: curves.data?.find((item) => item.id === curveId),
    curveOptions,
    curveLabel,
    reference,
    references,
    setDiscount,
    switchTo,
    savedPoints: pointsToSave(discount, allRows, shown, curve?.points ?? null),
    saveDate: curve?.date ?? cmarket.data?.date ?? form.settlementDate ?? '',
  }
}
