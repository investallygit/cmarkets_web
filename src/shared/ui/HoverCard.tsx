import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const MARGIN = 4
/** Time to move the pointer from the trigger onto the card without it closing. */
const CLOSE_DELAY_MS = 150

interface HoverCardProps {
  /** What the card shows: text, no control (it is a tooltip). */
  content: ReactNode
  /**
   * The trigger, given the id of the card while it shows, for its aria-describedby: a link or a
   * button opens the card on focus too; a plain element on the pointer only.
   */
  children: (describedBy: string | undefined) => ReactNode
}

/**
 * A card shown under its trigger on hover or focus (WCAG 1.4.13): it stays while the pointer
 * moves onto it, Escape closes it without moving the pointer or the focus, and it follows its
 * trigger when the page scrolls. In a portal at a fixed place, so that a panel's scrolling body
 * does not cut it.
 */
export function HoverCard({ content, children }: HoverCardProps) {
  const id = useId()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const [open, setOpen] = useState(false)

  const show = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Under the trigger, or above it near the bottom, within the window's width; it follows the
  // trigger when the page scrolls (the focus scrolls a tag into view), hidden while it is out.
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const card = cardRef.current
    if (!open || !anchor || !card) return
    const place = () => {
      const trigger = anchor.getBoundingClientRect()
      const size = card.getBoundingClientRect()
      const below = trigger.bottom + MARGIN
      const top =
        below + size.height > window.innerHeight - MARGIN
          ? Math.max(MARGIN, trigger.top - size.height - MARGIN)
          : below
      card.style.left = `${Math.max(MARGIN, Math.min(trigger.left, window.innerWidth - size.width - MARGIN))}px`
      card.style.top = `${top}px`
      card.style.visibility =
        trigger.bottom >= 0 && trigger.top <= window.innerHeight ? 'visible' : 'hidden'
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onFocus={show}
      onBlur={hide}
    >
      {children(open ? id : undefined)}
      {open &&
        createPortal(
          <div
            ref={cardRef}
            id={id}
            role="tooltip"
            onMouseEnter={show}
            onMouseLeave={hideSoon}
            className="invisible fixed top-0 left-0 z-50 w-max max-w-72 border bg-panel-header p-2 font-sans text-data shadow-lg"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  )
}
