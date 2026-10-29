import { clsx } from 'clsx'

interface SparklineProps {
  values: readonly number[]
  width?: number
  height?: number
  className?: string
}

/** Small trend line for table cells, green when the period ends higher, red otherwise. */
export function Sparkline({ values, width = 72, height = 16, className }: SparklineProps) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const step = width / (values.length - 1)
  const points = values
    .map((value, index) => {
      const x = index * step
      const y = height - 1 - ((value - min) / span) * (height - 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const rising = values[values.length - 1] >= values[0]

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={clsx(rising ? 'text-up' : 'text-down', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </svg>
  )
}
