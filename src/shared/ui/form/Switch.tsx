import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
  className?: string
}

/**
 * A setting turned on or off at once, label on the left and the switch on the right, green when
 * on: the displayed information of NET ME (spec section 9, screen 12). A native checkbox with the
 * switch role keeps the keyboard and screen reader behaviour.
 */
export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <label
      className={clsx(
        'relative flex min-h-6 items-center justify-between gap-3 font-sans text-label',
        disabled ? 'opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={clsx(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors motion-reduce:transition-none',
          'peer-focus-visible:ring-1 peer-focus-visible:ring-accent-amber peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app',
          checked ? 'border-up bg-up' : 'border-secondary bg-panel-header',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 size-3.5 rounded-full transition-transform motion-reduce:transition-none',
            checked ? 'translate-x-4 bg-app' : 'bg-primary',
          )}
        />
      </span>
    </label>
  )
}
