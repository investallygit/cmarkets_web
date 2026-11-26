import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel } from '@/shared/ui/Panel'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { useBondPricingStore } from '../model/bondPricingStore'
import { editRate, rateOutOfRange } from '../model/discountForm'
import type { PricingForm } from '../model/pricingForm'
import { clearRates, parsePasted, pasteRates, shiftRates, startFromCurve } from '../model/rateEntry'
import { useDiscountRates, useScheduleRows } from '../model/useDiscountRates'
import { RateHelpers } from './RateHelpers'
import { RateTable } from './RateTable'
import { TenorTable } from './TenorTable'

/** The entry's table, which block B's "Enter the rates" reaches. */
export const RATE_ENTRY_ID = 'bp-rate-entry'

/**
 * Screen 16, "Rate entry by cash-flow date" (spec section 9, sixth version; ROADMAP decision 56):
 * in the layout's place of "Calculation method" while block B takes a curve or rates entered. One
 * row per remaining cash-flow date (or standard tenor), the reference rate greyed, the entry cell
 * and the spread, which follows each keystroke; the four entry helpers beside it. Enter confirms
 * the cell and stays on it, Tab and ↓ go to the next row, Shift+Tab and ↑ back; an empty date is
 * red and Calculate waits for it. A rate of the curve changed makes the rates entered.
 */
export function RateEntryPanel() {
  const { t } = useTranslation()
  const form = useBondPricingStore((state) => state.form)
  const byTenor = form?.discount.mode === 'rates' && form.discount.entry === 'tenors'
  return (
    <Panel
      title={t(byTenor ? 'bondPricing.entry.titleTenors' : 'bondPricing.entry.title')}
      code="BP"
      bodyClassName="flex flex-col"
    >
      {form ? <Entry form={form} /> : <PanelLoading />}
    </Panel>
  )
}

function Entry({ form }: { form: PricingForm }) {
  const { t } = useTranslation()
  const rows = useScheduleRows(form)
  const rates = useDiscountRates(form, rows)
  const { discount, shown, references, setDiscount } = rates
  const [pasteError, setPasteError] = useState<string | null>(null)
  const byTenor = discount.mode === 'rates' && discount.entry === 'tenors'
  const table = { rows: rates.rows, shown }
  const change = (next: typeof discount) => {
    setPasteError(null)
    setDiscount(next)
  }
  const paste = (text: string, from = 0) => {
    const { lines, bad } = parsePasted(text)
    const error =
      bad.length > 0
        ? t('bondPricing.discount.helpers.badLines', { lines: bad.join(', ') })
        : lines.length === 0
          ? t('bondPricing.discount.helpers.nothing')
          : null
    const result = error ? null : pasteRates(discount, lines, { ...table, from })
    if (result && result.unmatched === 0) {
      change(result.discount)
      return true
    }
    setPasteError(error ?? t('bondPricing.discount.helpers.unmatched'))
    return false
  }

  // The keyboard of the mockup: Enter confirms and stays, ↓ and ↑ move a row (Tab goes on alone).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    const cells = [...event.currentTarget.querySelectorAll<HTMLInputElement>('tbody input')]
    const index = cells.indexOf(target)
    if (index < 0) return
    const next =
      event.key === 'ArrowDown'
        ? cells[index + 1]
        : event.key === 'ArrowUp'
          ? cells[index - 1]
          : event.key === 'Enter'
            ? target
            : null
    if (next === null) return
    event.preventDefault()
    if (!next) return
    if (next !== target) {
      next.focus()
      next.select()
      return
    }
    // The cell reformats on blur: Enter shows the rate as it is kept, the focus staying on it.
    target.blur()
    target.focus()
    requestAnimationFrame(() => {
      if (document.activeElement === target) target.select()
    })
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3 p-2">
      <div className="grid min-w-[17rem] flex-[3_1_20rem] grid-cols-[minmax(0,1fr)] content-start gap-1.5">
        <div id={RATE_ENTRY_ID} onKeyDown={onKeyDown}>
          {byTenor && references ? (
            <TenorTable
              tenors={discount.tenors}
              references={references.tenors}
              onEdit={(tenor, rate) =>
                change({ ...discount, tenors: { ...discount.tenors, [tenor]: rate } })
              }
              onPasteAt={(index, text) => void paste(text, index)}
            />
          ) : (
            <RateTable
              rows={rows}
              rates={shown}
              references={references?.rows}
              caption={t('bondPricing.discount.tableCaption')}
              isInvalid={(rate) =>
                discount.mode === 'rates' && (rate === null || rateOutOfRange(rate))
              }
              onEdit={(date, rate) => change(editRate(discount, date, rate, table))}
              onPasteAt={(index, text) => void paste(text, index)}
            />
          )}
        </div>
        <p className="justify-self-start border border-accent-amber/70 px-2 py-0.5 font-sans text-title text-accent-amber">
          {t('bondPricing.entry.keys')}
        </p>
        {pasteError && (
          <p role="alert" className="font-sans text-title text-down">
            {pasteError}
          </p>
        )}
        {rates.reference && (
          <p className="font-sans text-title text-secondary">
            {t('bondPricing.discount.referenceNote', { curve: rates.curveLabel(rates.reference) })}
          </p>
        )}
        <p className="font-sans text-title text-secondary">
          {discount.mode === 'curve'
            ? t('bondPricing.discount.notes.curve')
            : t(byTenor ? 'bondPricing.entry.notes.tenors' : 'bondPricing.entry.notes.dates')}
        </p>
      </div>
      {rows !== null && (
        <div className="min-w-[14rem] flex-[2_1_14rem]">
          <RateHelpers
            curves={rates.curveOptions}
            cmarketId={rates.cmarketId}
            date={form.settlementDate}
            onStart={(started) => change(startFromCurve(discount, started, rates.rows))}
            onShift={(bp) => change(shiftRates(discount, bp, table))}
            onPaste={(text) => paste(text)}
            onClear={() => change(clearRates(discount, table))}
          />
        </div>
      )}
    </div>
  )
}
