import { describe, expect, it } from 'vitest'
import { priceTicks, yieldTicks } from './axes'

describe('the axes of the price-yield curve', () => {
  it('marks each whole yield of the curve, as the mockup from 3% to 9%', () => {
    expect(yieldTicks(2.7302, 8.7302)).toEqual([3, 4, 5, 6, 7, 8])
    expect(yieldTicks(-1.5, 1.5)).toEqual([-1, 0, 1])
  })

  it('rounds the price axis to a step of five intervals at most', () => {
    expect(priceTicks(93.66, 110.05)).toEqual({
      low: 92,
      high: 112,
      ticks: [92, 96, 100, 104, 108, 112],
    })
    expect(priceTicks(99.2, 100.4)).toEqual({ low: 99, high: 100.5, ticks: [99, 99.5, 100, 100.5] })
  })
})
