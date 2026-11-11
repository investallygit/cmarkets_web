import { clsx } from 'clsx'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { DateInput } from '@/shared/ui/form/DateInput'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { scheduleAddsUp, scheduleTotal, type RedemptionRow } from '../model/pricingForm'

interface RedemptionScheduleEditorProps {
  rows: RedemptionRow[]
  onChange: (rows: RedemptionRow[]) => void
  onAdd: () => void
  /** The server's word on the schedule: off the payment dates, not ending at maturity. */
  error?: string
}

/**
 * The repayments of an amortizing bond entered by hand: a date and a share of the original face
 * each, adding up to 100% and ending at maturity (spec section 14.1, "Amort_i").
 */
export function RedemptionScheduleEditor({
  rows,
  onChange,
  onAdd,
  error,
}: RedemptionScheduleEditorProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const set = (index: number, change: Partial<RedemptionRow>) =>
    onChange(rows.map((row, at) => (at === index ? { ...row, ...change } : row)))
  const addsUp = scheduleAddsUp(rows)

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-sans text-data text-secondary">
        {t('bondPricing.schedule.legend')}
      </legend>
      {rows.map((row, index) => {
        const n = index + 1
        return (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_5.5rem_1.5rem] gap-1">
            <DateInput
              value={row.date}
              onChange={(date) => set(index, { date })}
              aria-label={t('bondPricing.schedule.date', { n })}
            />
            <NumberInput
              value={row.pct}
              onChange={(pct) => set(index, { pct })}
              decimals={2}
              suffix="%"
              aria-label={t('bondPricing.schedule.pct', { n })}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, at) => at !== index))}
              aria-label={t('bondPricing.schedule.remove', { n })}
              className="inline-flex size-6 items-center justify-center self-center text-secondary hover:text-down"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </div>
        )
      })}
      <div className="flex items-center justify-between gap-2 font-sans text-title">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-6 items-center gap-1 text-info hover:underline"
        >
          <Plus aria-hidden className="size-3.5" />
          {t('bondPricing.schedule.add')}
        </button>
        <span className={clsx('font-mono', addsUp ? 'text-secondary' : 'text-warning')}>
          {t('bondPricing.schedule.total', {
            value: format.percent(scheduleTotal(rows), 2, false),
          })}
        </span>
      </div>
      {!addsUp && (
        <p className="font-sans text-title text-warning">{t('bondPricing.schedule.mustAddUp')}</p>
      )}
      {error && (
        <p role="alert" className="font-sans text-title text-down">
          {error}
        </p>
      )}
    </fieldset>
  )
}
