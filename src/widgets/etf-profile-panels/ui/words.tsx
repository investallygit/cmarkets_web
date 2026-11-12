import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export const DASH = '—'

/** A line of a block of figures: its name on the left, its value on the right, rows striped. */
export function FigureLine({
  label,
  value,
  title,
  className,
}: {
  label: string
  value: ReactNode
  /** What the value rests on, as a tooltip: the risk-free rate, the drawdown's dates. */
  title?: string
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-baseline justify-between gap-3 px-2 py-1 even:bg-panel-header/40',
        className,
      )}
    >
      <dt className="font-sans text-data text-secondary">{label}</dt>
      <dd title={title} className="text-right font-mono text-data text-primary">
        {value}
      </dd>
    </div>
  )
}
