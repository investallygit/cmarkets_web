import { Check } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { MenuItem } from './menu'

const MENU_WIDTH = 216
const ITEM_HEIGHT = 26

interface ContextMenuProps {
  x: number
  y: number
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
 * Right-click menu of tables, also used as the dropdown of the user badge. It takes the focus on
 * opening: the arrows, Home and End go through the entries, Escape closes it and Tab leaves it;
 * the focus then goes back to where it was, the row or the button that opened it.
 */
export function ContextMenu({ x, y, items, onClose, ignoreRef }: ContextMenuProps) {
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

  const left = Math.max(4, Math.min(x, window.innerWidth - MENU_WIDTH - 4))
  const top = Math.max(4, Math.min(y, window.innerHeight - items.length * ITEM_HEIGHT - 8))

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ left, top, width: MENU_WIDTH }}
      className="fixed z-50 border bg-panel-header py-1 font-sans text-data shadow-lg"
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
            onClick={() => {
              item.onSelect?.()
              onClose()
            }}
            className="flex h-6.5 w-full items-center gap-2 px-3 text-left text-primary outline-none hover:bg-selected focus-visible:bg-selected disabled:text-secondary disabled:hover:bg-transparent"
          >
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              {item.checked ? (
                <Check aria-hidden className="size-3.5 text-accent-amber" />
              ) : (
                Icon && <Icon aria-hidden className="size-3.5 text-secondary" />
              )}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
