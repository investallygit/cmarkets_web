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
