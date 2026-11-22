/** Steps of a price axis, in points: at most five intervals from the lowest price to the highest. */
const PRICE_STEPS = [0.5, 1, 2, 4, 5, 10, 20, 50] as const

/** The whole yields between the first and the last of the curve, in percent. */
export function yieldTicks(from: number, to: number): number[] {
  const ticks: number[] = []
  for (let tick = Math.ceil(from); tick <= Math.floor(to); tick += 1) ticks.push(tick)
  return ticks
}

/** A price axis around the curve: round bounds a step apart, about five ticks. */
export function priceTicks(
  min: number,
  max: number,
): { low: number; high: number; ticks: number[] } {
  const step = PRICE_STEPS.find((candidate) => (max - min) / candidate <= 5) ?? PRICE_STEPS.at(-1)!
  const low = Math.floor(min / step) * step
  const high = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let index = 0; low + index * step <= high + 1e-9; index += 1) ticks.push(low + index * step)
  return { low, high, ticks }
}

interface RatePoint {
  years: number
  ratePct: number
}

/**
 * The years a curve chart shows and the curve's points in them: from 0 to a whole year past the
 * last cash flow, half as far again (two years at least) where the curve goes on; the curve cut at
 * that year at its interpolated rate, so that its line reaches the edge.
 */
export function curveWindow(
  curve: readonly RatePoint[],
  flowYears: readonly number[],
): { high: number; points: RatePoint[] } {
  const sorted = [...curve].sort((left, right) => left.years - right.years)
  const lastFlow = Math.max(0, ...flowYears)
  const lastNode = sorted.at(-1)?.years ?? 0
  const reach = Math.max(lastFlow * 1.5, lastFlow + 2)
  const high = Math.max(1, Math.ceil(Math.min(Math.max(lastNode, lastFlow), reach)))
  const points = sorted.filter((point) => point.years <= high)
  const after = sorted.find((point) => point.years > high)
  const before = points.at(-1)
  if (after && before && before.years < high) {
    const ratePct =
      before.ratePct +
      ((after.ratePct - before.ratePct) * (high - before.years)) / (after.years - before.years)
    points.push({ years: high, ratePct })
  }
  return { high, points }
}
