import { describe, expect, it } from 'vitest'
import { formatDailyLimit, isLinkInForce } from './linkDisplay'

const NBSP = ' '

describe('formatDailyLimit', () => {
  it('writes the limits as screen 27 does, a decimal only when needed', () => {
    expect(formatDailyLimit(1_000_000_000, 'en')).toBe(`1${NBSP}Bn`)
    expect(formatDailyLimit(500_000_000, 'en')).toBe(`500${NBSP}M`)
    expect(formatDailyLimit(1_500_000_000, 'en')).toBe(`1.5${NBSP}Bn`)
    expect(formatDailyLimit(1_000_000_000, 'fr')).toBe(`1${NBSP}Md`)
    expect(formatDailyLimit(250_000, 'fr')).toBe(`250${NBSP}k`)
  })
})

describe('isLinkInForce', () => {
  it('holds a request waiting and a confirmed link, not one that ended', () => {
    expect(
      ['pending', 'confirmed', 'declined', 'expired', 'withdrawn'].map((status) =>
        isLinkInForce(status as Parameters<typeof isLinkInForce>[0]),
      ),
    ).toEqual([true, true, false, false, false])
  })
})
