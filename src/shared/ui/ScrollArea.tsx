import { clsx } from 'clsx'
import { useRef, type ReactNode } from 'react'
import { useKeyboardScrolling } from '@/shared/lib/useKeyboardScrolling'

/**
 * A box that scrolls its content. With nothing in it to focus, it takes the focus itself, so the
 * keyboard can scroll it too, and shows it with the amber ring. It holds what is positioned in it,
 * such as the sr-only text of a table, which would otherwise widen the page past a narrow window.
 */
export function ScrollArea({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useKeyboardScrolling(ref)
  return (
    <div
      ref={ref}
      className={clsx(
        'relative overflow-auto outline-none focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:ring-inset',
        className,
      )}
    >
      {children}
    </div>
  )
}
