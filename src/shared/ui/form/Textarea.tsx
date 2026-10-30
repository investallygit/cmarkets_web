import { clsx } from 'clsx'
import type { TextareaHTMLAttributes } from 'react'
import { useField } from './fieldContext'

interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  value: string
  onChange: (value: string) => void
  highlight?: boolean
}

export function Textarea({
  value,
  onChange,
  highlight,
  className,
  id,
  rows = 3,
  ...rest
}: TextareaProps) {
  const field = useField()
  return (
    <textarea
      {...rest}
      id={id ?? field?.controlId}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      className={clsx(
        'block w-full resize-y border bg-app px-2 py-1.5 font-sans text-data text-primary outline-none placeholder:text-secondary',
        'focus-visible:ring-1 focus-visible:ring-accent-amber/40 disabled:opacity-50',
        field?.invalid
          ? 'border-down'
          : clsx(highlight && 'border-accent-amber', 'focus-visible:border-accent-amber'),
        className,
      )}
    />
  )
}
