import { describe, expect, it } from 'vitest'
import { loopingWalk, twicePath } from './backgroundLines'

describe('the lines behind the hero', () => {
  it('are the same on every visit, within ±1', () => {
    const line = loopingWalk(7, 60)
    expect(loopingWalk(7, 60)).toEqual(line)
    expect(line).toHaveLength(60)
    expect(Math.max(...line.map(Math.abs))).toBeCloseTo(1, 10)
  })

  it('end where they start, so the slide loops without a jump', () => {
    const line = loopingWalk(3, 40)
    const path = twicePath(line, 1200, 100, 50)
    const ys = [...path.matchAll(/[ML][\d.]+,([\d.-]+)/g)].map((match) => Number(match[1]))
    expect(ys).toHaveLength(81)
    // The second period repeats the first, and the last point closes it.
    expect(ys.slice(40, 80)).toEqual(ys.slice(0, 40))
    expect(ys[80]).toBe(ys[0])
  })
})
