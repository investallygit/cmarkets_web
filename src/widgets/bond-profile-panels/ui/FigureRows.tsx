import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export interface FigureRow {
  label: string
  value: ReactNode
  /** In yellow: a yield to worst other than the yield to maturity. */
  warning?: boolean
}

/** Screen 20's panels: a label on the left, its figures on the right, every other row shaded. */
export function FigureRows({ rows }: { rows: readonly FigureRow[] }) {
  return (
    <dl>
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={clsx(
            'flex min-h-row items-center gap-3 px-2 py-0.5',
            index % 2 === 1 && 'bg-row-alt',
          )}
        >
          <dt className="min-w-0 font-sans text-data text-secondary">{row.label}</dt>
          <dd
            className={clsx(
              'ml-auto text-right font-mono text-data',
              row.warning ? 'text-warning' : 'text-primary',
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
