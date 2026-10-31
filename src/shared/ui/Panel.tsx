import { clsx } from 'clsx'
import { useId, type ReactNode } from 'react'
import { PanelLayoutMenu } from './PanelLayoutMenu'
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
 * options and the function code on the right. The title bar is the drag handle in a workspace,
 * where the code opens the panel's layout menu, the same moves without dragging. On a phone the
 * options that do not fit go to the next line of the bar rather than past its edge.
 * A body that scrolls with nothing to focus in it takes the focus itself (ScrollArea).
 */
export function Panel({ title, code, options, children, className, bodyClassName }: PanelProps) {
  const titleId = useId()
  return (
    <section className={clsx('flex h-full min-h-0 flex-col border bg-panel', className)}>
      <header className="panel-drag-handle flex min-h-bar shrink-0 cursor-move flex-wrap items-center gap-x-3 border-b bg-panel-header px-2 select-none md:h-bar md:flex-nowrap">
        <h2
          id={titleId}
          className="truncate font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
        >
          {title}
        </h2>
        {/* Its buttons are 24 px targets (WCAG 2.5.8), as tall as the bar. */}
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 font-mono text-title text-secondary uppercase md:shrink-0 md:flex-nowrap [&_button]:min-h-6 [&_button]:min-w-6">
          {options}
          <PanelLayoutMenu code={code} titleId={titleId} />
        </div>
      </header>
      <ScrollArea className={clsx('min-h-0 flex-1', bodyClassName)}>{children}</ScrollArea>
    </section>
  )
}
