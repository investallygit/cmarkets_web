import { clsx } from 'clsx'
import { NavLink } from 'react-router'

export interface ScreenTab {
  to: string
  /** Function code before the label, e.g. "DES" in "DES Profile". */
  code?: string
  label: string
}

interface ScreenTabsProps {
  tabs: readonly ScreenTab[]
  /** Name of the tab list for screen readers. */
  label: string
}

/** Tabs under a screen header, each one a route of its own (spec section 9, screen 2). */
export function ScreenTabs({ tabs, label }: ScreenTabsProps) {
  return (
    <nav aria-label={label} className="flex min-w-0 shrink-0 gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            clsx(
              'inline-flex h-6 shrink-0 items-center gap-2 border px-3 font-sans text-data whitespace-nowrap',
              'outline-none focus-visible:ring-1 focus-visible:ring-accent-amber',
              isActive
                ? 'border-accent-amber/50 bg-selected font-semibold text-accent-amber'
                : 'bg-panel text-secondary hover:text-primary',
            )
          }
        >
          {tab.code && <span className="font-mono">{tab.code}</span>}
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
