import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { useField } from './fieldContext'
import { FRAMED_CONTROL, InputFrame } from './InputFrame'

interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size'
> {
  value: string
  onChange: (value: string) => void
  /** Leading icon, e.g. a magnifying glass for a search box. */
  icon?: LucideIcon
  highlight?: boolean
  /** Codes and figures use the monospaced font (spec section 8). */
  mono?: boolean
  className?: string
}

export function TextInput({
  value,
  onChange,
  icon: Icon,
  highlight,
  mono = false,
  className,
  id,
  type = 'text',
  ...rest
}: TextInputProps) {
  const field = useField()
  return (
    <InputFrame
      highlight={highlight}
      invalid={field?.invalid}
      disabled={rest.disabled}
      className={className}
    >
      {Icon && <Icon aria-hidden className="size-3.5 shrink-0 text-secondary" />}
      <input
        {...rest}
        id={id ?? field?.controlId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        className={clsx(FRAMED_CONTROL, mono ? 'font-mono' : 'font-sans')}
      />
    </InputFrame>
  )
}
