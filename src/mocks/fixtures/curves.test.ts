import { describe, expect, it } from 'vitest'
import { createAuctions } from './auctions'
import { yieldCurve } from './curves'

// Thursday 29 October 2026, during the session.
const NOW = Date.parse('2026-10-29T10:00:00Z')
const TODAY = '2026-10-29'

describe('yield curves', () => {
  const auctions = createAuctions(NOW)

  it('place the auctions of the last 90 days, BTA rates converted', () => {
    const curve = yieldCurve('CM', TODAY, TODAY, auctions)
    const sixMonths = curve.points.find((point) => point.years === 0.5)
    // Today's 26-week BTA at 4.95%: the example of spec section 14.1.
    expect(sixMonths).toEqual({ years: 0.5, yieldPct: 5.0819, source: 'auction' })
    // The 5-year OTA rate is already a compound yield.
    expect(curve.points.find((point) => point.years === 5)).toMatchObject({
      yieldPct: 6.6,
      source: 'auction',
    })
    expect(curve.points.find((point) => point.years === 10)).toMatchObject({
      yieldPct: 7.2,
      source: 'file',
    })
  })

  it('come from the curve file before the auctions, 0.15 point lower a month earlier', () => {
    const curve = yieldCurve('CM', '2026-09-29', TODAY, auctions)
    expect(curve.points.every((point) => point.source === 'file')).toBe(true)
    expect(curve.points[0].yieldPct).toBeCloseTo(4.6 - 0.15, 2)
  })
})
