import { ChevronDown } from 'lucide-react'

export interface PanelSelectOption<T extends string> {
  value: T
  label: string
}

interface PanelSelectProps<T extends string> {
  value: T
  options: readonly PanelSelectOption<T>[]
  onChange: (value: T) => void
  'aria-label': string
}

/**
 * A choice among many in a panel title bar, e.g. "ALL COUNTRIES" in the auctions panel of the
 * screen 4 mockup. The native <select> keeps the keyboard and screen reader behaviour.
 */
export function PanelSelect<T extends string>({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
}: PanelSelectProps<T>) {
  return (
    <span className="panel-no-drag relative inline-flex items-center">
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value as T)}
        className="cursor-pointer appearance-none bg-transparent pr-3.5 uppercase outline-none hover:text-primary focus-visible:text-primary focus-visible:ring-1 focus-visible:ring-accent-amber"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-0 size-3" />
    </span>
  )
}
