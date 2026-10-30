import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { useField } from './fieldContext'
import { FRAMED_CONTROL, InputFrame } from './InputFrame'

export interface SelectOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SelectProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  /** Amber border, e.g. an active screener criterion (spec section 9, screen 3). */
  highlight?: boolean
  /** Text before the value, e.g. "Type:" in "Type: All". */
  prefix?: string
  className?: string
}

/** Drop-down list. The native <select> keeps the keyboard and screen reader behaviour. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  highlight,
  prefix,
  className,
  id,
  ...rest
}: SelectProps<T>) {
  const field = useField()
  return (
    <InputFrame
      highlight={highlight}
      invalid={field?.invalid}
      disabled={rest.disabled}
      className={className}
    >
      {prefix && <span className="shrink-0 font-mono text-data text-secondary">{prefix}</span>}
      <select
        {...rest}
        id={id ?? field?.controlId}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        className={clsx(FRAMED_CONTROL, 'cursor-pointer appearance-none pr-5 font-mono')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 size-3.5 text-secondary"
      />
    </InputFrame>
  )
}
