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

/**
 * Each option is a 24 px target (WCAG 2.5.8), as tall as the title bar, its label as small as the
 * bar's text: the padding keeps the 8 px between labels.
 */
const OPTION = 'inline-flex h-6 min-w-6 items-center justify-center uppercase'

/** Panel options with the active one in square brackets (spec section 9). */
export function PanelTabs<T extends string>({ value, options, onChange }: PanelTabsProps<T>) {
  return (
    <div role="tablist" className="panel-no-drag flex items-center">
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
              OPTION,
              'px-1',
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

interface PanelToggleProps {
  active: boolean
  onChange: (active: boolean) => void
  disabled?: boolean
  children: string
}

/** A panel option switched on and off on its own, e.g. MA20; in brackets while on. */
export function PanelToggle({ active, onChange, disabled = false, children }: PanelToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={clsx(
        OPTION,
        'panel-no-drag disabled:text-secondary/50',
        active ? 'text-primary' : 'text-secondary enabled:hover:text-primary',
      )}
    >
      {active ? `[${children}]` : children}
    </button>
  )
}
