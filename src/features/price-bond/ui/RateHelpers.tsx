import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurve } from '@/entities/bond'
import type { CurveDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'

type Helper = 'start' | 'shift' | 'paste'

interface RateHelpersProps {
  /** The curves of block B's list, as it labels them. */
  curves: readonly { value: string; label: string }[]
  /** CMarket's curve, read on the settlement date as the reference rates are. */
  cmarketId: string
  date: string | null
  onStart: (curve: CurveDto) => void
  onShift: (bp: number) => void
  /** The text pasted; whether it filled the table (else the block says why). */
  onPaste: (text: string) => boolean
  onClear: () => void
}

const LINK =
  'inline-flex min-h-6 items-center font-sans text-data text-info hover:underline aria-expanded:text-accent-amber'

/**
 * The helpers above block B's table (ROADMAP decision 46, the client's answer of 22 November
 * 2026): start from a curve, shift all rows by a number of bp, paste rates copied from Excel,
 * clear. Each but Clear opens a small form under the row; Enter applies it, not Calculate.
 */
export function RateHelpers({
  curves,
  cmarketId,
  date,
  onStart,
  onShift,
  onPaste,
  onClear,
}: RateHelpersProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<Helper | null>(null)
  const [curveId, setCurveId] = useState<string | null>(null)
  const chosen = curveId ?? curves.at(0)?.value ?? null
  const curve = useCurve(open === 'start' ? chosen : null, chosen === cmarketId ? date : null)
  const [shift, setShift] = useState<number | null>(null)
  const [pasted, setPasted] = useState('')

  const toggle = (helper: Helper) => setOpen(open === helper ? null : helper)
  const apply = () => {
    if (open === 'start' && curve.data) onStart(curve.data)
    else if (open === 'shift' && shift !== null) onShift(shift)
    else if (open === 'paste' && pasted.trim() !== '') {
      if (!onPaste(pasted)) return
      setPasted('')
    } else return
    setOpen(null)
  }
  // Enter in a field applies the helper, not the inputs' Calculate around it.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return
    event.preventDefault()
    apply()
  }
  const ready =
    (open === 'start' && curve.data !== undefined) ||
    (open === 'shift' && shift !== null) ||
    (open === 'paste' && pasted.trim() !== '')

  return (
    <div className="grid gap-1">
      <div
        role="group"
        aria-label={t('bondPricing.discount.helpers.label')}
        className="flex flex-wrap gap-x-3"
      >
        {(['start', 'shift', 'paste'] as const).map((helper) => (
          <button
            key={helper}
            type="button"
            aria-expanded={open === helper}
            onClick={() => toggle(helper)}
            className={LINK}
          >
            {t(`bondPricing.discount.helpers.${helper}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setOpen(null)
            onClear()
          }}
          className={LINK}
        >
          {t('bondPricing.discount.helpers.clear')}
        </button>
      </div>
      {open && (
        <div
          role="group"
          aria-label={t(`bondPricing.discount.helpers.${open}`)}
          className="grid gap-2 border bg-panel-header p-2"
          onKeyDown={onKeyDown}
        >
          {open === 'start' && (
            <Field label={t('bondPricing.curves.label')}>
              <Select
                value={chosen ?? ''}
                options={[...curves]}
                onChange={(value: string) => setCurveId(value)}
              />
            </Field>
          )}
          {open === 'shift' && (
            <Field label={t('bondPricing.discount.helpers.shiftBy')}>
              <NumberInput value={shift} onChange={setShift} decimals={1} autoFocus />
            </Field>
          )}
          {open === 'paste' && (
            <Field
              label={t('bondPricing.discount.helpers.pasteLabel')}
              hint={t('bondPricing.discount.helpers.pasteHint')}
            >
              <Textarea value={pasted} onChange={setPasted} rows={4} autoFocus />
            </Field>
          )}
          <div className="flex gap-2">
            <Button variant="primary" onClick={apply} disabled={!ready} busy={curve.isFetching}>
              {t('bondPricing.discount.helpers.apply')}
            </Button>
            <Button onClick={() => setOpen(null)}>{t('bondPricing.curves.cancel')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
