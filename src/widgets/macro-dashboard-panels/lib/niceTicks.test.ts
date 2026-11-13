import { describe, expect, it } from 'vitest'
import { niceTicks } from './niceTicks'

describe('niceTicks', () => {
  it('gives the mockup’s ticks to the CEMAC’s growth since 2010', () => {
    expect(niceTicks(-6.2, 13.6)).toEqual([-10, -5, 0, 5, 10, 15])
  })

  it('takes steps of 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceTicks(0.9, 8.1)).toEqual([0, 2, 4, 6, 8, 10])
    expect(niceTicks(1_900_000, 29_100_000)).toEqual([0, 10_000_000, 20_000_000, 30_000_000])
    expect(niceTicks(520, 8450)).toEqual([0, 2000, 4000, 6000, 8000, 10000])
  })

  it('opens a flat series and draws nothing without figures', () => {
    expect(niceTicks(3.6, 3.6)).toEqual([3.2, 3.4, 3.6, 3.8, 4])
    expect(niceTicks(Infinity, -Infinity)).toEqual([])
  })
})
