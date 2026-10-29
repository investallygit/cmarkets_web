import { Check } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'
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

/** Right-click menu of tables, also used as the dropdown of the user badge. */
export function ContextMenu({ x, y, items, onClose, ignoreRef }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || ignoreRef?.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
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

  const left = Math.max(4, Math.min(x, window.innerWidth - MENU_WIDTH - 4))
  const top = Math.max(4, Math.min(y, window.innerHeight - items.length * ITEM_HEIGHT - 8))

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ left, top, width: MENU_WIDTH }}
      className="fixed z-50 border bg-panel-header py-1 font-sans text-data shadow-lg"
      onContextMenu={(event) => event.preventDefault()}
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
            disabled={item.disabled}
            onClick={() => {
              item.onSelect?.()
              onClose()
            }}
            className="flex h-6.5 w-full items-center gap-2 px-3 text-left text-primary hover:bg-selected disabled:text-secondary disabled:hover:bg-transparent"
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
