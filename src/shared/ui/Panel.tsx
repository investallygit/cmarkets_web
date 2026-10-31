import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { ScrollArea } from './ScrollArea'

interface PanelProps {
  title: ReactNode
  /** Function code shown at the far right of the title bar, e.g. "MKT" or "GP". */
  code?: string
  /** Options on the right of the title bar (tabs, buttons). */
  options?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Panel shared by every screen (spec section 9): amber upper-case title on the left,
 * options and the function code on the right. The title bar is the drag handle in a workspace.
 * A body that scrolls with nothing to focus in it takes the focus itself (ScrollArea).
 */
export function Panel({ title, code, options, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={clsx('flex h-full min-h-0 flex-col border bg-panel', className)}>
      <header className="panel-drag-handle flex h-bar shrink-0 cursor-move items-center gap-3 border-b bg-panel-header px-2 select-none">
        <h2 className="truncate font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
          {title}
        </h2>
        {/* Its buttons are 24 px targets (WCAG 2.5.8), as tall as the bar. */}
        <div className="ml-auto flex shrink-0 items-center gap-3 font-mono text-title text-secondary uppercase [&_button]:min-h-6 [&_button]:min-w-6">
          {options}
          {code && <span>{code}</span>}
        </div>
      </header>
      <ScrollArea className={clsx('min-h-0 flex-1', bodyClassName)}>{children}</ScrollArea>
    </section>
  )
}
