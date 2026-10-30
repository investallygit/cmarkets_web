import { clsx } from 'clsx'
import { useId, type ReactNode } from 'react'
import { useField } from './fieldContext'

type Tone = 'neutral' | 'up' | 'down'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  /** Green or red choice, e.g. Buy and Sell. */
  tone?: Exclude<Tone, 'neutral'>
  /** One choice not offered, e.g. Paid for a publication already read for free. */
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  /** null: nothing chosen yet. */
  value: T | null
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  /** Needed outside a <Field group>, which otherwise names the group. */
  'aria-label'?: string
  className?: string
}

const IDLE: Record<Tone, string> = {
  neutral: 'text-secondary hover:text-primary',
  up: 'border-up/40 text-up',
  down: 'border-down/40 text-down',
}

const ACTIVE: Record<Tone, string> = {
  neutral: 'border-accent-amber bg-selected font-semibold text-primary',
  up: 'border-up bg-up/15 font-semibold text-up',
  down: 'border-down bg-down/15 font-semibold text-down',
}

/**
 * One choice among a few, side by side: Company / Country, Free / Paid, Buy / Hold / Sell.
 * Native radio buttons keep the arrow keys and screen reader behaviour.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const field = useField()
  const name = useId()
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : field?.labelId}
      aria-describedby={field?.describedBy}
      className={clsx('grid auto-cols-fr grid-flow-col gap-1.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        const tone = option.tone ?? 'neutral'
        const off = disabled || option.disabled
        return (
          <label
            key={option.value}
            className={clsx(
              'flex h-7 min-w-0 items-center justify-center border px-2 font-sans text-data',
              'has-focus-visible:ring-1 has-focus-visible:ring-accent-amber has-focus-visible:ring-offset-1 has-focus-visible:ring-offset-app',
              active ? ACTIVE[tone] : IDLE[tone],
              off ? 'opacity-50' : 'cursor-pointer',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              disabled={off}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="truncate">{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}
