import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'info' | 'amber' | 'warning' | 'up' | 'down'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-secondary/50 text-secondary',
  info: 'border-info/50 bg-info/10 text-info',
  amber: 'border-accent-amber/60 bg-accent-amber/10 text-accent-amber',
  warning: 'border-warning/50 bg-warning/10 text-warning',
  up: 'border-up/50 bg-up/10 text-up',
  down: 'border-down/50 bg-down/10 text-down',
}

/** Short upper-case label in a box: document type, price, status (spec section 9). */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex h-4.5 shrink-0 items-center justify-center border px-1.5 font-mono text-caption font-semibold uppercase',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}
