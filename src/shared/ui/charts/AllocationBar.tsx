import { useFormat } from '@/shared/i18n'

/** A class of a breakdown: its name, its share in percent, its colour (a plain value: SVG and style need one). */
export interface AllocationRow {
  key: string
  label: string
  weightPct: number
  color: string
}

/**
 * A breakdown as a stacked bar and its legend (spec section 9: PORT's allocation, screen 19's):
 * each class as wide as its share, in the order given, then each with its colour and its percent.
 * The bar says the whole breakdown to a screen reader.
 */
export function AllocationBar({ rows }: { rows: readonly AllocationRow[] }) {
  const format = useFormat()
  const percent = (value: number) => format.percent(value, 1, false)
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div
        role="img"
        aria-label={rows.map((row) => `${row.label} ${percent(row.weightPct)}`).join(', ')}
        className="flex h-5 w-full shrink-0 gap-0.5"
      >
        {rows
          .filter((row) => row.weightPct > 0)
          .map((row) => (
            <div
              key={row.key}
              title={`${row.label}: ${percent(row.weightPct)}`}
              className="min-w-0.5 first:rounded-l-xs last:rounded-r-xs"
              style={{ flexGrow: row.weightPct, flexBasis: 0, backgroundColor: row.color }}
            />
          ))}
      </div>
      <ul className="flex min-h-0 flex-col gap-1.5 overflow-auto">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2 font-sans text-label">
            <span
              aria-hidden
              className="size-2.5 shrink-0"
              style={{ backgroundColor: row.color }}
            />
            <span className="truncate">{row.label}</span>
            <span className="ml-auto font-mono text-data">{percent(row.weightPct)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
