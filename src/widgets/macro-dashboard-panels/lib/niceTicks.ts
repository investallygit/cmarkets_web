/** The steps a value axis takes, times a power of ten: 1, 2, 2.5, 5. */
const STEPS = [1, 2, 2.5, 5, 10]

/**
 * Round ticks around the figures drawn, as the screen 25 mockup's 15, 10, 5, 0, -5: the smallest
 * step of 1, 2, 2.5 or 5 times a power of ten that needs at most `count` intervals, zero among them
 * when the figures cross it.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1
    return niceTicks(min - pad, max + pad, count)
  }
  const raw = (max - min) / count
  const power = 10 ** Math.floor(Math.log10(raw))
  for (const factor of STEPS) {
    const step = factor * power
    const low = Math.floor(min / step) * step
    const high = Math.ceil(max / step) * step
    if (Math.round((high - low) / step) <= count) {
      const ticks: number[] = []
      for (let tick = low; tick <= high + step / 2; tick += step)
        ticks.push(Number(tick.toPrecision(12)))
      return ticks
    }
  }
  return [min, max]
}
