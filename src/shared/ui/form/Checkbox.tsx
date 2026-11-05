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
  /** A colour of its own, such as an account type's: its frame, and its fill once checked. */
  color?: string
  className?: string
}

/**
 * Checked boxes are green, as the ticked disclosures of the publishing studio (screen 7), unless
 * they have a colour of their own, as the account types of the directory (screen 10).
 */
export function Checkbox({
  checked,
  onChange,
  label,
  highlight,
  color,
  className,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={clsx(
        'relative inline-flex items-center gap-2 font-sans text-data',
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
            ? clsx('text-app', !color && 'border-up bg-up')
            : highlight
              ? 'border-accent-amber'
              : !color && 'border-secondary',
        )}
        style={
          color ? { borderColor: color, backgroundColor: checked ? color : undefined } : undefined
        }
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      {label}
    </label>
  )
}
