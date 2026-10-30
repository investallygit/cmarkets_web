/** Automatic logout after inactivity (spec section 6): 30 minutes, the last one with a warning. */
export const INACTIVITY_LIMIT_MS = 30 * 60_000
export const INACTIVITY_WARNING_MS = 60_000

export type InactivityPhase = 'active' | 'warning' | 'expired'

/** Where the user stands after `idleMs` without an action, and the time left before logout. */
export function inactivityState(idleMs: number): { phase: InactivityPhase; remainingMs: number } {
  const remainingMs = Math.max(0, INACTIVITY_LIMIT_MS - idleMs)
  if (remainingMs === 0) return { phase: 'expired', remainingMs }
  return { phase: remainingMs <= INACTIVITY_WARNING_MS ? 'warning' : 'active', remainingMs }
}
