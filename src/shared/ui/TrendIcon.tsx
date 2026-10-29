import { clsx } from 'clsx'
import { Square, Triangle } from 'lucide-react'
import type { TrendDirection } from './trend'

interface TrendIconProps {
  direction: TrendDirection
  className?: string
}

/** Filled triangle up / down, or a square when unchanged. Takes the text colour. */
export function TrendIcon({ direction, className }: TrendIconProps) {
  if (direction === 'flat') {
    return (
      <Square aria-hidden strokeWidth={0} className={clsx('size-[7px] fill-current', className)} />
    )
  }
  return (
    <Triangle
      aria-hidden
      strokeWidth={0}
      className={clsx('size-2 fill-current', direction === 'down' && 'rotate-180', className)}
    />
  )
}
