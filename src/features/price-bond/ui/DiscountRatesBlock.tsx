import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHasPermission } from '@/entities/session'
import type { BondDto, MarketYieldDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { useBondPricingStore } from '../model/bondPricingStore'
import type { DiscountChoice, RateEntry, ScheduleRow } from '../model/discountForm'
import { entryStatus } from '../model/entryStatus'
import type { PricingForm, RangeError } from '../model/pricingForm'
import { useDiscountRates } from '../model/useDiscountRates'
import { BlockHeading } from './BlockHeading'
import { CurveActions } from './CurveActions'
import { EntryStatusBox } from './EntryStatusBox'
import { RATE_ENTRY_ID } from './RateEntryPanel'
import { RateTable } from './RateTable'
import { SaveCurveForm } from './SaveCurveForm'
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
 * Block B of screen 16, "Discount rates" (spec section 9, sixth version): one yield (or a clean
 * price, whose yield is computed) with the cash-flow dates greyed at that rate; a curve of the
 * list (CMarket's of the bond's country, the custom curves); or rates entered by cash-flow date or
 * by standard tenor. With a curve or rates entered, the table and its helpers are the panel "Rate
 * entry by cash-flow date" (ROADMAP decision 56); the block keeps the mode, the entry status and
 * "Save as custom curve".
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
  const canSave = useHasPermission('analysis:save')
  const [saving, setSaving] = useState(false)
  const rates = useDiscountRates(form, rows)
  const { discount, curveId, summary, setDiscount, pricedYield } = rates
  const switchTo = (change: { mode: DiscountChoice; entry?: RateEntry }) => {
    setSaving(false)
    rates.switchTo(change)
  }
  const tableError =
    (outOfRange.has('rates') ? t('bondPricing.ranges.rates') : undefined) ??
    serverError('discount.rates') ??
    serverError('discount.tenors') ??
    serverError('discount.curveId') ??
    serverError('discount') ??
    serverError('cleanPrice')
  const status =
    discount.mode === 'rates' ? entryStatus(discount, rates.rows, rates.references) : null
  const goToEntry = () =>
    document.getElementById(RATE_ENTRY_ID)?.querySelector<HTMLInputElement>('tbody input')?.focus()

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
            error={rates.curves.isError ? rates.curves.error.message : undefined}
          >
            <Select
              value={curveId ?? rates.cmarketId}
              options={rates.curveOptions}
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

      {status && (
        <EntryStatusBox
          status={status}
          byTenor={discount.entry === 'tenors'}
          start={rates.reference ? rates.curveLabel(rates.reference) : null}
        />
      )}

      {discount.mode === 'yield' ? (
        <>
          <RateTable
            rows={rows}
            rates={rates.shown}
            caption={t('bondPricing.discount.tableCaption')}
          />
          <p className="font-sans text-title text-secondary">
            {t('bondPricing.discount.notes.yield')}
          </p>
        </>
      ) : (
        <p className="font-sans text-title text-secondary">
          {t(
            discount.mode === 'curve'
              ? 'bondPricing.entry.inPanelCurve'
              : discount.entry === 'tenors'
                ? 'bondPricing.entry.inPanelTenors'
                : 'bondPricing.entry.inPanel',
          )}{' '}
          <button
            type="button"
            onClick={goToEntry}
            disabled={rows === null}
            className="inline-flex min-h-6 items-center font-sans text-data text-info hover:underline disabled:text-secondary disabled:no-underline"
          >
            {t('bondPricing.entry.goTo')}
          </button>
        </p>
      )}
      {tableError && (
        <p role="alert" className="font-sans text-title text-down">
          {tableError}
        </p>
      )}

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
            points={rates.savedPoints}
            date={rates.saveDate}
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
            disabled={rates.savedPoints.length === 0}
            className="inline-flex min-h-6 items-center self-start font-sans text-data text-info hover:underline disabled:text-secondary disabled:no-underline"
          >
            {t('bondPricing.curves.save')}
          </button>
        ))}
    </>
  )
}
