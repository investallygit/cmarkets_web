import { describe, expect, it } from 'vitest'
import { mergeLayout, samePositions } from './mergeLayout'

const defaults = [
  { i: 'indices', x: 0, y: 0, w: 4, h: 7, minW: 3 },
  { i: 'chart', x: 4, y: 0, w: 4, h: 11 },
]

describe('mergeLayout', () => {
  it('uses the defaults when nothing was saved', () => {
    expect(mergeLayout(defaults, undefined)).toEqual(defaults)
  })

  it('applies saved positions, keeps constraints and ignores removed panels', () => {
    const saved = [
      { i: 'indices', x: 8, y: 2, w: 4, h: 9 },
      { i: 'old-panel', x: 0, y: 0, w: 2, h: 2 },
    ]
    expect(mergeLayout(defaults, saved)).toEqual([
      { i: 'indices', x: 8, y: 2, w: 4, h: 9, minW: 3 },
      { i: 'chart', x: 4, y: 0, w: 4, h: 11 },
    ])
  })
})

describe('samePositions', () => {
  it('compares positions regardless of order', () => {
    const a = [
      { i: 'a', x: 0, y: 0, w: 1, h: 1 },
      { i: 'b', x: 1, y: 0, w: 1, h: 1 },
    ]
    expect(samePositions(a, [...a].reverse())).toBe(true)
    expect(samePositions(a, [{ ...a[0], x: 2 }, a[1]])).toBe(false)
  })
})
