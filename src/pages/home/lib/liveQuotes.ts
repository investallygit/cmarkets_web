/** A quote of the home page's picture of the terminal: sample figures, not market data. */
export interface SampleQuote {
  code: string
  value: number
  previousClose: number
  /** The smallest move: a hundredth of a point for an index, 50 XAF for a share. */
  tick: number
}

/** About this share of the quotes moves at each beat. */
const MOVING_SHARE = 0.35

/**
 * The next value of a sample quote: a random step of up to 0.15% (a tick at least), pulled back
 * towards the sample, so the picture never strays far from the mockup's figures.
 */
export function nextValue(sample: SampleQuote, value: number, random: () => number): number {
  const range = Math.max(sample.tick, value * 0.0015)
  const pull = (sample.value - value) * 0.25
  const ticks = Math.round((value + (random() * 2 - 1) * range + pull) / sample.tick)
  return Number((ticks * sample.tick).toFixed(2))
}

/** One beat: some quotes move, the others keep their value, so only the moves flash. */
export function tickValues(
  values: readonly number[],
  samples: readonly SampleQuote[],
  random: () => number,
): number[] {
  return values.map((value, index) =>
    random() < MOVING_SHARE ? nextValue(samples[index], value, random) : value,
  )
}

export const changePctOf = (sample: SampleQuote, value: number) =>
  (value / sample.previousClose - 1) * 100
