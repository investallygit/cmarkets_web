import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Checkbox } from './Checkbox'
import { useField } from './fieldContext'
import { FRAMED_CONTROL, InputFrame } from './InputFrame'
import type { SelectOption } from './Select'

interface MultiSelectProps<T extends string> {
  values: readonly T[]
  options: readonly SelectOption<T>[]
  onChange: (values: T[]) => void
  /** What an empty choice reads, e.g. "All". */
  placeholder: string
  /** Amber border, e.g. an active screener criterion (spec section 9). */
  highlight?: boolean
  className?: string
}

/**
 * Several values in one field, as a drop-down shows one ("Global, US" on screen 15): a click lists
 * the options as boxes beneath it, in the flow of the form (a scrolling panel does not clip them);
 * Escape or a second click closes them. The values keep the options' order.
 */
export function MultiSelect<T extends string>({
  values,
  options,
  onChange,
  placeholder,
  highlight,
  className,
}: MultiSelectProps<T>) {
  const field = useField()
  const listId = useId()
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const chosen = options.filter((option) => values.includes(option.value))
  const text = chosen.length === 0 ? placeholder : chosen.map((option) => option.label).join(', ')

  return (
    <div
      className={clsx('flex flex-col gap-1', className)}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        event.stopPropagation()
        setOpen(false)
        button.current?.focus()
      }}
    >
      <InputFrame highlight={highlight} invalid={field?.invalid}>
        <button
          ref={button}
          type="button"
          id={field?.controlId}
          aria-expanded={open}
          aria-controls={listId}
          aria-describedby={field?.describedBy}
          onClick={() => setOpen((current) => !current)}
          className={clsx(FRAMED_CONTROL, 'cursor-pointer truncate pr-5 text-left font-mono')}
        >
          {text}
        </button>
        <ChevronDown
          aria-hidden
          className={clsx(
            'pointer-events-none absolute right-2 size-3.5 text-secondary',
            open && 'rotate-180',
          )}
        />
      </InputFrame>
      <div
        id={listId}
        role="group"
        aria-labelledby={field?.labelId}
        hidden={!open}
        className="flex flex-col gap-1.5 border bg-app px-2 py-1.5"
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            checked={values.includes(option.value)}
            disabled={option.disabled}
            onChange={(checked) =>
              onChange(
                options
                  .map((candidate) => candidate.value)
                  .filter((value) => (value === option.value ? checked : values.includes(value))),
              )
            }
            label={option.label}
          />
        ))}
      </div>
    </div>
  )
}
