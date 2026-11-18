import { describe, expect, it } from 'vitest'
import { isConvertible } from './amount'

describe('isConvertible (B49)', () => {
  it('asks for an amount above 0 within the limit, nothing else', () => {
    expect(isConvertible(10_000_000)).toBe(true)
    expect(isConvertible(0.01)).toBe(true)
    for (const amount of [null, 0, -5, Infinity, Number.NaN, 1e20])
      expect(isConvertible(amount)).toBe(false)
  })
})
