/**
 * Round ticks for a percent axis that holds every value with a little room: from a step below the
 * lowest (0 at least, unless a value is negative) to the step above the highest. The step suits
 * the values' own span: returns from 5.7% to 12% go by 1 point.
 */
export function percentTicks(
  values: readonly number[],
  step?: number,
): { domain: [number, number]; ticks: number[] } {
  const finite = values.filter(Number.isFinite)
  const max = finite.length > 0 ? Math.max(...finite) : 1
  const min = finite.length > 0 ? Math.min(...finite) : 0
  const span = Math.max(max - min, 1)
  const unit = step ?? (span <= 8 ? 1 : span <= 16 ? 2 : span <= 40 ? 5 : 10)
  const low =
    min < 0 ? Math.floor(min / unit) * unit : Math.max(0, Math.floor(min / unit) * unit - unit)
  const high = Math.ceil((max * 1.05) / unit) * unit
  const ticks: number[] = []
  for (let tick = low; tick <= high + 1e-9; tick += unit) ticks.push(Math.round(tick * 100) / 100)
  return { domain: [low, high], ticks }
}

/** The point of the frontier closest to a return clicked, so that the curve answers a click anywhere along it. */
export function nearestPoint<T extends { returnPct: number }>(
  points: readonly T[],
  returnPct: number,
): T | undefined {
  let best: T | undefined
  for (const point of points)
    if (!best || Math.abs(point.returnPct - returnPct) < Math.abs(best.returnPct - returnPct))
      best = point
  return best
}
