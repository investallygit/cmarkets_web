import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'defaultChecked' | 'onChange'
> {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Without a label, pass an aria-label. */
  label?: ReactNode
  /** Amber box while unchecked: a tick still expected, e.g. a mandatory disclosure. */
  highlight?: boolean
  className?: string
}

/** Checked boxes are green, as the ticked disclosures of the publishing studio (screen 7). */
export function Checkbox({
  checked,
  onChange,
  label,
  highlight,
  className,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={clsx(
        'inline-flex items-center gap-2 font-sans text-data',
        rest.disabled ? 'opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <input
        {...rest}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={clsx(
          'flex size-3.5 shrink-0 items-center justify-center border',
          'peer-focus-visible:ring-1 peer-focus-visible:ring-accent-amber peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app',
          checked
            ? 'border-up bg-up text-app'
            : highlight
              ? 'border-accent-amber'
              : 'border-secondary',
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      {label}
    </label>
  )
}
