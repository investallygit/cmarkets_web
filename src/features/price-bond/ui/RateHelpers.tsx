import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurve } from '@/entities/bond'
import type { CurveDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'

interface RateHelpersProps {
  /** The curves of block B's list, as it labels them. */
  curves: readonly { value: string; label: string }[]
  /** CMarket's curve, read on the settlement date as the reference rates are. */
  cmarketId: string
  date: string | null
  onStart: (curve: CurveDto) => void
  onShift: (bp: number) => void
  /** The text pasted; whether it filled the table (else the panel says why). */
  onPaste: (text: string) => boolean
  onClear: () => void
}

/**
 * The entry helpers beside the table (spec section 9, sixth version; ROADMAP decision 56): 1)
 * start from a curve, its rates copied on every row; 2) shift all rows by a number of bp; 3) paste
 * two columns "date ; rate" copied from Excel; 4) clear the entries. Enter in a helper's field
 * applies it.
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
  const headingId = useId()
  const [curveId, setCurveId] = useState<string | null>(null)
  const chosen = curveId ?? curves.at(0)?.value ?? null
  const curve = useCurve(chosen, chosen === cmarketId ? date : null)
  const [shift, setShift] = useState<number | null>(null)
  const [pasting, setPasting] = useState(false)
  const [pasted, setPasted] = useState('')

  const applyShift = () => {
    if (shift !== null) onShift(shift)
  }
  const applyPaste = () => {
    if (pasted.trim() === '' || !onPaste(pasted)) return
    setPasted('')
    setPasting(false)
  }
  const onEnter = (apply: () => void) => (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    apply()
  }

  return (
    <section
      aria-labelledby={headingId}
      className="grid grid-cols-[minmax(0,1fr)] content-start gap-2"
    >
      <h3
        id={headingId}
        className="font-mono text-label font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('bondPricing.entry.helpers')}
      </h3>
      <Helper label={t('bondPricing.entry.start')}>
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <Select
              value={chosen ?? ''}
              options={[...curves]}
              onChange={(value: string) => setCurveId(value)}
              aria-label={t('bondPricing.entry.start')}
            />
          </div>
          <Button
            variant="info"
            onClick={() => curve.data && onStart(curve.data)}
            disabled={!curve.data}
            busy={curve.isFetching}
          >
            {t('bondPricing.entry.copy')}
          </Button>
        </div>
      </Helper>
      <Helper label={t('bondPricing.entry.shift')}>
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <NumberInput
              value={shift}
              onChange={setShift}
              onKeyDown={onEnter(applyShift)}
              decimals={1}
              suffix={t('bondPricing.entry.bp')}
              aria-label={t('bondPricing.discount.helpers.shiftBy')}
            />
          </div>
          <Button variant="info" onClick={applyShift} disabled={shift === null}>
            {t('bondPricing.discount.helpers.apply')}
          </Button>
        </div>
      </Helper>
      <Helper label={t('bondPricing.entry.paste')}>
        {pasting ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
            <Textarea
              value={pasted}
              onChange={setPasted}
              rows={4}
              autoFocus
              aria-label={t('bondPricing.discount.helpers.pasteLabel')}
            />
            <p className="font-sans text-title text-secondary">
              {t('bondPricing.discount.helpers.pasteHint')}
            </p>
            <div className="flex gap-1.5">
              <Button variant="primary" onClick={applyPaste} disabled={pasted.trim() === ''}>
                {t('bondPricing.discount.helpers.apply')}
              </Button>
              <Button onClick={() => setPasting(false)}>{t('bondPricing.curves.cancel')}</Button>
            </div>
          </div>
        ) : (
          <Button variant="info" onClick={() => setPasting(true)} className="w-full">
            {t('bondPricing.entry.pasteButton')}
          </Button>
        )}
      </Helper>
      <Helper label={t('bondPricing.entry.clear')}>
        <Button variant="danger" onClick={onClear} className="w-full">
          {t('bondPricing.discount.helpers.clear')}
        </Button>
      </Helper>
    </section>
  )
}

function Helper({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-[minmax(0,1fr)] gap-1">
      <p className="font-sans text-title text-secondary">{label}</p>
      {children}
    </div>
  )
}
