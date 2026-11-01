import { Check } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { shortcutLabel } from '@/shared/lib/keyboard'
import type { MenuItem } from './menu'

const MIN_WIDTH = 216
/**
 * A long entry ("Show: Latest government securities auctions (BEAC)") widens the menu up to
 * this, then goes on to a second line.
 */
const MAX_WIDTH = 400
const MARGIN = 4

interface ContextMenuProps {
  /** Where it opens: its left edge, or its right edge with align "end", as under a button. */
  x: number
  y: number
  align?: 'start' | 'end'
  items: readonly MenuItem[]
  onClose: () => void
  /** Clicks on this element (e.g. the button that toggles the menu) do not close it. */
  ignoreRef?: RefObject<HTMLElement | null>
}

/** The entries the arrows go through: the disabled ones cannot take the focus. */
function entriesOf(menu: HTMLElement): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')]
}

/**
 * Right-click menu of tables, also used as the dropdown of the user badge and of a panel's code.
 * It takes the focus on opening: the arrows, Home and End go through the entries, Escape closes
 * it and Tab leaves it; the focus then goes back to where it was, the row or the button that
 * opened it. An entry with a shortcut shows its keys, which screen readers get as
 * aria-keyshortcuts.
 */
export function ContextMenu({
  x,
  y,
  align = 'start',
  items,
  onClose,
  ignoreRef,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || ignoreRef?.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onClose)
    window.addEventListener('blur', onClose)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('blur', onClose)
    }
  }, [onClose, ignoreRef])

  // Before the browser paints, as wide as its longest entry, it goes where it fits whole; taller
  // than the window, it scrolls.
  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const { width, height } = menu.getBoundingClientRect()
    const left = align === 'end' ? x - width : x
    menu.style.left = `${Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN))}px`
    menu.style.top = `${Math.max(MARGIN, Math.min(y, window.innerHeight - height - MARGIN))}px`
  }, [x, y, align, items.length])

  // Before the browser paints: the focus moves in, and back out when the menu closes, unless the
  // user has put it somewhere else meanwhile.
  useLayoutEffect(() => {
    const menu = menuRef.current
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (menu) entriesOf(menu)[0]?.focus()
    return () => {
      if (menu?.contains(document.activeElement)) openerRef.current?.focus()
    }
  }, [])

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = entriesOf(event.currentTarget)
    const current = entries.indexOf(document.activeElement as HTMLElement)
    const next =
      event.key === 'ArrowDown'
        ? current + 1
        : event.key === 'ArrowUp'
          ? current - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? entries.length - 1
              : null
    if (next !== null) {
      event.preventDefault()
      entries[(next + entries.length) % entries.length]?.focus()
    } else if (event.key === 'Tab') {
      // Back on the opener first, so that Tab goes on from there, as from a closed menu.
      openerRef.current?.focus()
      onClose()
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        minWidth: MIN_WIDTH,
        maxWidth: `min(${MAX_WIDTH}px, calc(100vw - ${2 * MARGIN}px))`,
      }}
      className="fixed z-50 max-h-[calc(100vh-8px)] w-max overflow-y-auto border bg-panel-header py-1 font-sans text-data shadow-lg"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={onMenuKeyDown}
    >
      {items.map((item) => {
        if (item.kind === 'separator') {
          return <div key={item.id} role="separator" className="my-1 border-t" />
        }
        if (item.kind === 'label') {
          return (
            <div
              key={item.id}
              className="px-3 pt-1.5 pb-1 text-title tracking-title text-secondary uppercase"
            >
              {item.label}
            </div>
          )
        }
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
            aria-keyshortcuts={item.shortcut}
            onClick={() => {
              item.onSelect?.()
              onClose()
            }}
            className="flex min-h-6.5 w-full items-center gap-2 px-3 py-1 text-left text-primary outline-none hover:bg-selected focus-visible:bg-selected disabled:text-secondary disabled:hover:bg-transparent"
          >
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              {item.checked ? (
                <Check aria-hidden className="size-3.5 text-accent-amber" />
              ) : (
                Icon && <Icon aria-hidden className="size-3.5 text-secondary" />
              )}
            </span>
            <span className="min-w-0 wrap-break-word">{item.label}</span>
            {/* Screen readers have aria-keyshortcuts. */}
            {item.shortcut && (
              <span aria-hidden className="ml-auto pl-2 font-mono text-secondary">
                {shortcutLabel(item.shortcut)}
              </span>
            )}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
