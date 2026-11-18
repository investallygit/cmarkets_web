import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

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

/** The strip fades out at an edge beyond which tabs are hidden. */
function edgeMask(start: boolean, end: boolean): string | undefined {
  if (!start && !end) return undefined
  return `linear-gradient(to right, ${start ? 'transparent, black 1.5rem' : 'black'}, ${
    end ? 'black calc(100% - 1.5rem), transparent' : 'black'
  })`
}

/**
 * Tabs under a screen header, each one a route of its own (spec section 9, screen 2). A strip
 * narrower than its tabs scrolls: the tab shown is brought into view, and the strip fades out at
 * an edge beyond which tabs are hidden (B15).
 */
export function ScreenTabs({ tabs, label }: ScreenTabsProps) {
  const strip = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const [edges, setEdges] = useState({ start: false, end: false })
  const measure = () => {
    const element = strip.current
    if (!element) return
    const start = element.scrollLeft > 0
    const end = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end },
    )
  }

  useEffect(() => {
    const element = strip.current
    const active = element?.querySelector<HTMLElement>('[aria-current="page"]')
    if (element && active) {
      // Within the strip only: the page itself does not move.
      const left = active.offsetLeft - element.offsetLeft
      const right = left + active.offsetWidth
      if (left < element.scrollLeft || right > element.scrollLeft + element.clientWidth)
        element.scrollLeft = left - (element.clientWidth - active.offsetWidth) / 2
    }
    measure()
  }, [pathname])

  useEffect(() => {
    const element = strip.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mask = edgeMask(edges.start, edges.end)
  return (
    <nav
      ref={strip}
      aria-label={label}
      onScroll={measure}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      // Never wider than its line: in a row that wraps (OPT's, B26), the strip scrolls instead.
      className="flex max-w-full min-w-0 shrink-0 gap-1 overflow-x-auto"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
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
