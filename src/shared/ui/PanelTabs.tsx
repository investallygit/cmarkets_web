import { clsx } from 'clsx'

export interface PanelTabOption<T extends string> {
  value: T
  label: string
}

interface PanelTabsProps<T extends string> {
  value: T
  options: readonly PanelTabOption<T>[]
  onChange: (value: T) => void
}

/** Panel options with the active one in square brackets (spec section 9). */
export function PanelTabs<T extends string>({ value, options, onChange }: PanelTabsProps<T>) {
  return (
    <div role="tablist" className="panel-no-drag flex items-center gap-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'uppercase',
              active ? 'text-primary' : 'text-secondary hover:text-primary',
            )}
          >
            {active ? `[${option.label}]` : option.label}
          </button>
        )
      })}
    </div>
  )
}
