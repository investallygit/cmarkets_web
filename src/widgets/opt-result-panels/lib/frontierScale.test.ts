import { describe, expect, it } from 'vitest'
import { nearestPoint, percentTicks } from './frontierScale'

describe('the frontier chart', () => {
  it('draws the volatility from 0 on round ticks', () => {
    const { domain, ticks } = percentTicks([2.5, 5.4, 22])
    expect(domain[0]).toBe(0)
    expect(domain[1]).toBeGreaterThanOrEqual(22)
    expect(ticks.every((tick) => tick % 5 === 0)).toBe(true)
  })

  it('keeps the returns a step below their lowest', () => {
    const { domain, ticks } = percentTicks([5.7, 8, 12])
    expect(domain[0]).toBeLessThan(5.7)
    expect(domain[1]).toBeGreaterThan(12)
    expect(ticks[1]! - ticks[0]!).toBe(1)
  })

  it('answers a click with the nearest point of the curve', () => {
    const points = [{ returnPct: 7 }, { returnPct: 8 }, { returnPct: 9 }]
    expect(nearestPoint(points, 8.4)).toEqual({ returnPct: 8 })
    expect(nearestPoint([], 8)).toBeUndefined()
  })
})
