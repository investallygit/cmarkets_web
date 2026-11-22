import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cmarketCurveId, useBondPrice, useCurve, useCurves } from '@/entities/bond'
import { useHasPermission } from '@/entities/session'
import type { BondDto, CurveSummaryDto, MarketYieldDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { useBondPricingStore } from '../model/bondPricingStore'
import {
  editRate,
  pointsToSave,
  shownRates,
  switchDiscount,
  type DiscountChoice,
  type DiscountForm,
  type RateEntry,
  type ScheduleRow,
} from '../model/discountForm'
import type { PricingForm, RangeError } from '../model/pricingForm'
import { BlockHeading } from './BlockHeading'
import { CurveActions } from './CurveActions'
import { RateTable } from './RateTable'
import { SaveCurveForm } from './SaveCurveForm'
import { TenorTable } from './TenorTable'
import { YieldSource } from './YieldSource'

const MODES: readonly DiscountChoice[] = ['yield', 'curve', 'rates']
const ENTRIES: readonly RateEntry[] = ['dates', 'tenors']

interface DiscountRatesBlockProps {
  form: PricingForm
  bond: BondDto
  market: MarketYieldDto | undefined
  /** The bond's remaining cash-flow dates; null while they load or the bond is incomplete. */
  rows: readonly ScheduleRow[] | null
  outOfRange: ReadonlySet<RangeError>
  serverError: (field: string) => string | undefined
}

/**
 * Block B of screen 16, "Discount rates" (spec section 9, fifth version): one yield (or a clean
 * price, whose yield is computed), a curve of the list (CMarket's of the bond's country, the
 * custom curves), or rates entered by cash-flow date or by standard tenor. The table lists the
 * bond's remaining cash-flow dates with the rate of each; a curve's rate changed makes the rates
 * entered. The rates shown may be saved as a custom curve.
 */
export function DiscountRatesBlock({
  form,
  bond,
  market,
  rows,
  outOfRange,
  serverError,
}: DiscountRatesBlockProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const modeLabel = useId()
  const edit = useBondPricingStore((state) => state.edit)
  const submitted = useBondPricingStore((state) => state.submitted)
  const priced = useBondPrice(submitted)
  const canSave = useHasPermission('analysis:save')
  const [saving, setSaving] = useState(false)
  const { discount } = form

  const cmarketId = cmarketCurveId(form.country)
  const curveId = discount.mode === 'curve' ? (discount.curveId ?? cmarketId) : null
  const curves = useCurves(form.country, discount.mode === 'curve')
  // CMarket's curve on the settlement date: the tenors start from it, a curve saved takes its date.
  const cmarket = useCurve(cmarketId, form.settlementDate)
  const chosen = useCurve(curveId === cmarketId ? null : curveId)
  const curve = curveId === cmarketId ? cmarket.data : chosen.data
  const summary = curves.data?.find((item) => item.id === curveId)
  // The yield of the clean price entered is the last calculation's.
  const pricedYield = submitted?.cleanPrice !== undefined && priced.data ? priced.data.ytmPct : null
  const ytm = discount.byPrice ? pricedYield : form.ytm
  const allRows = rows ?? []
  const shown = shownRates(discount, allRows, { ytm, curve: curve?.points ?? null })
  const setDiscount = (next: DiscountForm) => edit({ discount: next })
  const switchTo = (change: { mode: DiscountChoice; entry?: RateEntry }) => {
    setSaving(false)
    setDiscount(
      switchDiscount(discount, change, {
        rows: allRows,
        shown,
        curve: curve?.points ?? cmarket.data?.points ?? null,
      }),
    )
  }

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

  const ratesEditable =
    discount.mode === 'curve' || (discount.mode === 'rates' && discount.entry === 'dates')
  const tableError =
    (outOfRange.has('rates') ? t('bondPricing.ranges.rates') : undefined) ??
    serverError('discount.rates') ??
    serverError('discount.tenors') ??
    serverError('discount.curveId') ??
    serverError('discount') ??
    serverError('cleanPrice')
  const savedPoints = pointsToSave(discount, allRows, shown, curve?.points ?? null)
  const saveDate = curve?.date ?? cmarket.data?.date ?? form.settlementDate ?? ''

  return (
    <>
      <BlockHeading>{t('bondPricing.discount.title')}</BlockHeading>
      <fieldset className="grid gap-1" aria-labelledby={modeLabel}>
        <legend id={modeLabel} className="sr-only">
          {t('bondPricing.discount.mode')}
        </legend>
        {MODES.map((mode) => (
          <label
            key={mode}
            className="flex min-h-6 cursor-pointer items-center gap-2 font-sans text-data"
          >
            <input
              type="radio"
              name={modeLabel}
              value={mode}
              checked={discount.mode === mode}
              onChange={() => switchTo({ mode })}
              className="size-4 accent-[var(--accent-amber)]"
            />
            {t(`bondPricing.discount.modes.${mode}`)}
          </label>
        ))}
      </fieldset>

      {discount.mode === 'yield' &&
        (discount.byPrice ? (
          <Field
            label={t('bondPricing.fields.cleanPrice')}
            hint={
              pricedYield === null
                ? t('bondPricing.discount.priceHint')
                : t('bondPricing.discount.priceYield', {
                    value: format.percent(pricedYield, 4, false),
                  })
            }
            error={
              discount.cleanPrice === null
                ? t('bondPricing.required')
                : outOfRange.has('cleanPrice')
                  ? t('bondPricing.ranges.cleanPrice')
                  : serverError('cleanPrice')
            }
          >
            <NumberInput
              value={discount.cleanPrice}
              onChange={(cleanPrice) => setDiscount({ ...discount, cleanPrice })}
              decimals={4}
              suffix="%"
              highlight
            />
          </Field>
        ) : (
          <Field
            label={t('bondPricing.fields.ytm')}
            hint={<YieldSource form={form} bond={bond} market={market} />}
            error={
              form.ytm === null
                ? t('bondPricing.required')
                : outOfRange.has('ytm')
                  ? t('bondPricing.ranges.ytm')
                  : serverError('ytm')
            }
          >
            <NumberInput
              value={form.ytm}
              onChange={(value) => edit({ ytm: value })}
              decimals={4}
              suffix="%"
              highlight
            />
          </Field>
        ))}

      {discount.mode === 'curve' && (
        <>
          <Field
            label={t('bondPricing.curves.label')}
            error={curves.isError ? curves.error.message : undefined}
          >
            <Select
              value={curveId ?? cmarketId}
              options={curveOptions}
              onChange={(value) => {
                setSaving(false)
                setDiscount({ ...discount, curveId: value })
              }}
            />
          </Field>
          {summary?.kind === 'custom' && (
            <CurveActions
              key={summary.id}
              curve={summary}
              canWrite={canSave}
              onDeleted={() => setDiscount({ ...discount, curveId: null })}
            />
          )}
        </>
      )}

      {discount.mode === 'rates' && (
        <Field label={t('bondPricing.discount.enterBy')} group>
          <SegmentedControl
            value={discount.entry}
            options={ENTRIES.map((entry) => ({
              value: entry,
              label: t(`bondPricing.discount.entries.${entry}`),
            }))}
            onChange={(entry) => switchTo({ mode: 'rates', entry })}
          />
        </Field>
      )}

      {discount.mode === 'rates' && discount.entry === 'tenors' && (
        <TenorTable
          tenors={discount.tenors}
          onEdit={(tenor, rate) =>
            setDiscount({ ...discount, tenors: { ...discount.tenors, [tenor]: rate } })
          }
        />
      )}

      <RateTable
        rows={rows}
        rates={shown}
        caption={t('bondPricing.discount.tableCaption')}
        onEdit={
          ratesEditable
            ? (date, rate) => setDiscount(editRate(discount, date, rate, { rows: allRows, shown }))
            : undefined
        }
      />
      {tableError && (
        <p role="alert" className="font-sans text-title text-down">
          {tableError}
        </p>
      )}
      <p className="font-sans text-title text-secondary">
        {discount.mode === 'rates'
          ? t(`bondPricing.discount.notes.${discount.entry}`)
          : t(`bondPricing.discount.notes.${discount.mode}`)}
      </p>

      {discount.mode === 'yield' && (
        <button
          type="button"
          onClick={() => setDiscount({ ...discount, byPrice: !discount.byPrice })}
          className="inline-flex min-h-6 items-center self-start font-sans text-data text-info hover:underline"
        >
          {discount.byPrice ? t('bondPricing.discount.byYield') : t('bondPricing.discount.byPrice')}
        </button>
      )}
      {discount.mode !== 'yield' &&
        canSave &&
        (saving ? (
          <SaveCurveForm
            points={savedPoints}
            date={saveDate}
            onCancel={() => setSaving(false)}
            onSaved={(saved) => {
              setSaving(false)
              // The curve saved is the one priced at: a shock by tenor is offered on it.
              setDiscount({ ...discount, mode: 'curve', curveId: saved.id })
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setSaving(true)}
            disabled={savedPoints.length === 0}
            className="inline-flex min-h-6 items-center self-start font-sans text-data text-info hover:underline disabled:text-secondary disabled:no-underline"
          >
            {t('bondPricing.curves.save')}
          </button>
        ))}
    </>
  )
}
