import type { CSSProperties } from 'react'

/** The n-th block of a section comes in after the ones before it (the .reveal class). */
export function revealDelay(index: number): CSSProperties {
  return { '--reveal-delay': `${120 + index * 90}ms` } as CSSProperties
}

/** The n-th line of the hero rises after the ones before it (motion-safe:animate-rise). */
export function riseDelay(step: number): CSSProperties {
  return { animationDelay: `${step * 90}ms` }
}
