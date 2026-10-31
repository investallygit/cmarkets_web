import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCorrectPrice } from '@/entities/stored-price'
import { isApiError } from '@/shared/api'
import type { StoredPriceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

const FIELDS = ['open', 'high', 'low', 'close', 'volume'] as const
type PriceField = (typeof FIELDS)[number]
type Values = Record<PriceField, number | null>

interface PriceCorrectionFormProps {
  securityId: string
  /** Code shown in the confirmation. */
  code: string
  stored: StoredPriceDto
  /** Price decimals of the security. */
  decimals: number
}

/** What is wrong with the prices typed, before asking the server. */
function priceErrors(values: Values): Partial<Record<PriceField, 'missing' | 'high' | 'low'>> {
  const errors: Partial<Record<PriceField, 'missing' | 'high' | 'low'>> = {}
  for (const field of FIELDS) {
    if (values[field] === null || (field !== 'volume' && (values[field] ?? 0) <= 0)) {
      errors[field] = 'missing'
    }
  }
  if (Object.keys(errors).length > 0) return errors
  const { open = 0, high = 0, low = 0, close = 0 } = values as Record<PriceField, number>
  if (high < Math.max(open, close, low)) errors.high = 'high'
  if (low > Math.min(open, close)) errors.low = 'low'
  return errors
}

/**
 * CORR: the stored session of a security typed again, with a required reason
 * (PUT /data/securities/{id}/prices/{date}); the log keeps the values before and after.
 */
export function PriceCorrectionForm({
  securityId,
  code,
  stored,
  decimals,
}: PriceCorrectionFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const correct = useCorrectPrice()
  const [values, setValues] = useState<Values>({
    open: stored.open,
    high: stored.high,
    low: stored.low,
    close: stored.close,
    volume: stored.volume,
  })
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const errors = priceErrors(values)
  const changed = FIELDS.some((field) => values[field] !== stored[field])
  const serverErrors = isApiError(correct.error, 400) ? (correct.error.problem.errors ?? {}) : {}
  const errorOf = (field: PriceField) =>
    (submitted && errors[field] && t(`corrections.errors.${errors[field]}`)) ||
    serverErrors[field]?.[0]
  const reasonError =
    (submitted && reason.trim().length < 5 && t('corrections.errors.reason')) ||
    serverErrors.reason?.[0]

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.keys(errors).length > 0 || reason.trim().length < 5 || !changed) return
        const { open, high, low, close, volume } = values as Record<PriceField, number>
        correct.mutate(
          {
            securityId,
            date: stored.date,
            correction: { open, high, low, close, volume, reason: reason.trim() },
          },
          {
            onSuccess: () => {
              setReason('')
              setSubmitted(false)
              toast.success(t('corrections.saved', { code, date: format.isoDate(stored.date) }))
            },
          },
        )
      }}
    >
      <div className="grid grid-cols-5 gap-2">
        {FIELDS.map((field) => (
          <Field
            key={field}
            label={t(`corrections.fields.${field}`)}
            error={errorOf(field)}
            hint={t('corrections.stored', {
              value: format.number(stored[field], field === 'volume' ? 0 : decimals),
            })}
          >
            <NumberInput
              value={values[field]}
              decimals={field === 'volume' ? 0 : decimals}
              onChange={(value) => {
                correct.reset()
                setValues((current) => ({ ...current, [field]: value }))
              }}
              highlight
            />
          </Field>
        ))}
      </div>
      <Field label={t('corrections.reason')} hint={t('corrections.reasonHint')} error={reasonError}>
        <Textarea value={reason} onChange={setReason} rows={2} highlight />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" busy={correct.isPending} disabled={!changed}>
          {t('corrections.submit')}
        </Button>
        {!changed && (
          <span className="font-sans text-data text-secondary">{t('corrections.unchanged')}</span>
        )}
        {correct.error && !isApiError(correct.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {correct.error.message}
          </span>
        )}
      </div>
    </form>
  )
}
