/**
 * The colour of a correlation cell (spec screen 28: "the brighter the cell, the more the two
 * securities move together"): the accent amber mixed into the panel by the correlation. Two bands
 * keep each figure at 4.5:1 or more: up to 45% amber with light text under 0.5, from 70% amber with
 * dark text from 0.5; a negative correlation stays on the panel's ground.
 */
export function cellTone(value: number): { background: string; text: string; amberPct: number } {
  const strength = Math.max(0, Math.min(1, value))
  const bright = strength >= 0.5
  const amberPct = Math.round(bright ? 70 + (strength - 0.5) * 60 : strength * 90)
  return {
    amberPct,
    background: `color-mix(in srgb, var(--accent-amber) ${amberPct}%, var(--bg-panel))`,
    text: bright ? 'var(--bg-app)' : 'var(--text-primary)',
  }
}
