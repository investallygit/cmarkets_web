import { clsx } from 'clsx'
import { CalendarDays } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { formatIsoDate } from '@/shared/lib/format'
import { parseDate } from '@/shared/lib/parse'
import { useField } from './fieldContext'
import { FRAMED_CONTROL, InputFrame } from './InputFrame'

/** Length of DD/MM/YYYY: shorter text is still being typed, not wrong. */
const FULL_DATE_LENGTH = 10
const DATE_CHARACTERS = /^[\d/.\- ]*$/

interface DateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
> {
  /** ISO calendar date, e.g. "2026-10-30". */
  value: string | null
  /** Called once a full date is typed, and with null when the field is emptied. */
  onChange: (value: string | null) => void
  highlight?: boolean
  className?: string
}

/**
 * Date typed as DD/MM/YYYY in both languages (spec section 8). The browser's date input is not
 * used because it follows the browser's locale (MM/DD/YYYY in American English).
 */
export function DateInput({
  value,
  onChange,
  highlight,
  className,
  id,
  onFocus,
  onBlur,
  ...rest
}: DateInputProps) {
  const { t } = useTranslation()
  const field = useField()
  /** Text being typed; null while the field does not have focus. */
  const [draft, setDraft] = useState<string | null>(null)
  const formatted = value ? formatIsoDate(value) : ''
  const wrong =
    draft !== null &&
    (!DATE_CHARACTERS.test(draft) ||
      (draft.trim().length >= FULL_DATE_LENGTH && parseDate(draft) === null))
  const invalid = wrong || field?.invalid

  return (
    <InputFrame
      highlight={highlight}
      invalid={invalid}
      disabled={rest.disabled}
      className={className}
    >
      <input
        {...rest}
        id={id ?? field?.controlId}
        type="text"
        autoComplete="off"
        maxLength={FULL_DATE_LENGTH + 2}
        placeholder={t('form.datePlaceholder')}
        value={draft ?? formatted}
        onFocus={(event) => {
          setDraft(formatted)
          onFocus?.(event)
        }}
        onChange={(event) => {
          const text = event.target.value
          setDraft(text)
          const parsed = parseDate(text)
          if (text.trim() === '') onChange(null)
          else if (parsed !== null) onChange(parsed)
        }}
        onBlur={(event) => {
          setDraft(null)
          onBlur?.(event)
        }}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        className={clsx(FRAMED_CONTROL, 'font-mono tabular-nums')}
      />
      <CalendarDays aria-hidden className="size-3.5 shrink-0 text-secondary" />
    </InputFrame>
  )
}
