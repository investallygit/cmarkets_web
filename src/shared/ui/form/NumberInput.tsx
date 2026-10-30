import { clsx } from 'clsx'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useLocale } from '@/shared/i18n'
import { formatNumber } from '@/shared/lib/format'
import { parseNumber } from '@/shared/lib/parse'
import { useField } from './fieldContext'
import { FRAMED_CONTROL, InputFrame } from './InputFrame'

interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
> {
  value: number | null
  /** Called with every readable number typed, and with null when the field is emptied. */
  onChange: (value: number | null) => void
  /** Decimals shown once the field loses focus. */
  decimals?: number
  /** Unit inside the field, e.g. "%" or "months". */
  suffix?: ReactNode
  highlight?: boolean
  className?: string
}

/**
 * Number in the format of the user's language (52 500,25 or 52,500.25), right-aligned in the
 * monospaced font. The text stays as typed while the field has focus and is reformatted on blur;
 * unreadable text shows a red border and leaves the last readable value in place.
 */
export function NumberInput({
  value,
  onChange,
  decimals = 2,
  suffix,
  highlight,
  className,
  id,
  onFocus,
  onBlur,
  ...rest
}: NumberInputProps) {
  const locale = useLocale()
  const field = useField()
  /** Text being typed; null while the field does not have focus. */
  const [draft, setDraft] = useState<string | null>(null)
  const formatted = value === null ? '' : formatNumber(value, locale, decimals)
  const unreadable = draft !== null && draft.trim() !== '' && parseNumber(draft, locale) === null
  const invalid = unreadable || field?.invalid

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
        inputMode="decimal"
        autoComplete="off"
        value={draft ?? formatted}
        onFocus={(event) => {
          setDraft(formatted)
          onFocus?.(event)
        }}
        onChange={(event) => {
          const text = event.target.value
          setDraft(text)
          const parsed = parseNumber(text, locale)
          if (text.trim() === '') onChange(null)
          else if (parsed !== null) onChange(parsed)
        }}
        onBlur={(event) => {
          setDraft(null)
          onBlur?.(event)
        }}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        className={clsx(FRAMED_CONTROL, 'text-right font-mono tabular-nums')}
      />
      {suffix && <span className="shrink-0 font-mono text-data text-secondary">{suffix}</span>}
    </InputFrame>
  )
}
