import { clsx } from 'clsx'
import { useState, type ReactNode } from 'react'

interface FlashProps {
  value: number
  children: ReactNode
  className?: string
}

/**
 * Flashes its content for 400 ms on an up / down background at 25% opacity whenever `value`
 * changes (spec section 8). The first render does not flash.
 */
export function Flash({ value, children, className }: FlashProps) {
  const [previous, setPrevious] = useState(value)
  const [flash, setFlash] = useState<{ direction: 'up' | 'down'; count: number } | null>(null)

  if (value !== previous) {
    setPrevious(value)
    setFlash({ direction: value > previous ? 'up' : 'down', count: (flash?.count ?? 0) + 1 })
  }

  return (
    // A new key restarts the CSS animation on every change.
    <span
      key={flash?.count ?? 0}
      className={clsx(
        '-mx-0.5 px-0.5',
        flash?.direction === 'up' && 'animate-flash-up',
        flash?.direction === 'down' && 'animate-flash-down',
        className,
      )}
    >
      {children}
    </span>
  )
}
