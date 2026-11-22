import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveCurve } from '@/entities/bond'
import { isApiError } from '@/shared/api'
import type { CurveDto, CurvePointDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

/** The longest name CMarket.Api keeps. */
const NAME_MAX_LENGTH = 80

interface SaveCurveFormProps {
  /** The curve's points: the curve shown, the rates entered at their times, or the tenors. */
  points: readonly CurvePointDto[]
  /** The day its rates are of. */
  date: string
  onSaved: (curve: CurveDto) => void
  onCancel: () => void
}

/**
 * "Save as custom curve" (ROADMAP decision 45): a name, the day of its rates, and whether the
 * user's organisation may use it; offered on any bond afterwards.
 */
export function SaveCurveForm({ points, date, onSaved, onCancel }: SaveCurveFormProps) {
  const { t } = useTranslation()
  const save = useSaveCurve()
  const [name, setName] = useState('')
  const [shared, setShared] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const trimmed = name.trim()
  const nameError = submitted && trimmed === '' ? t('bondPricing.curves.nameRequired') : undefined
  const serverError = (() => {
    if (isApiError(save.error, 409)) return save.error.message
    if (isApiError(save.error, 400)) {
      const errors = save.error.problem.errors ?? {}
      return errors.name?.[0] ?? errors.points?.[0] ?? save.error.message
    }
    return save.error?.message
  })()

  const submit = () => {
    setSubmitted(true)
    if (trimmed === '' || points.length === 0) return
    save.mutate(
      {
        name: trimmed,
        date,
        shared,
        points: points.map(({ years, ratePct, tenor }) => ({ years, ratePct, tenor })),
      },
      {
        onSuccess: (curve) => {
          toast.success(t('bondPricing.curves.saved', { name: curve.name }))
          onSaved(curve)
        },
      },
    )
  }

  return (
    <div
      role="group"
      aria-label={t('bondPricing.curves.save')}
      className="grid gap-2 border bg-panel-header p-2"
      // Enter saves the curve, not the inputs' Calculate around it.
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return
        event.preventDefault()
        if (event.target.type === 'text') submit()
      }}
    >
      <Field label={t('bondPricing.curves.name')} error={nameError ?? serverError}>
        <TextInput
          value={name}
          onChange={(value) => {
            save.reset()
            setName(value)
          }}
          maxLength={NAME_MAX_LENGTH}
          autoFocus
        />
      </Field>
      <Checkbox checked={shared} onChange={setShared} label={t('bondPricing.curves.share')} />
      <div className="flex gap-2">
        <Button
          variant="primary"
          busy={save.isPending}
          disabled={points.length === 0}
          onClick={submit}
        >
          {t('bondPricing.curves.saveButton')}
        </Button>
        <Button onClick={onCancel}>{t('bondPricing.curves.cancel')}</Button>
      </div>
    </div>
  )
}
