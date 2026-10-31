/** A seeded random number generator (mulberry32), so the lines are the same on every visit. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * One period of a line that looks like a price: a random walk whose drift is taken out, so it
 * ends where it starts and repeats without a jump. Values stay within ±1.
 */
export function loopingWalk(seed: number, points: number): number[] {
  const random = seeded(seed)
  const walk = [0]
  for (let index = 1; index <= points; index++) walk.push(walk[index - 1] + random() - 0.5)
  const drift = walk[points]
  const level = walk.map((value, index) => value - (drift * index) / points).slice(0, points)
  const span = Math.max(...level.map(Math.abs)) || 1
  return level.map((value) => value / span)
}

/**
 * The SVG path of a period drawn twice side by side, `width` each, around `middle` with
 * `amplitude`: sliding it by one period brings back the same picture.
 */
export function twicePath(
  values: readonly number[],
  width: number,
  middle: number,
  amplitude: number,
) {
  const step = width / values.length
  const points = [...values, ...values, values[0]]
  return points
    .map((value, index) => {
      const y = middle - value * amplitude
      return `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${y.toFixed(1)}`
    })
    .join('')
}
