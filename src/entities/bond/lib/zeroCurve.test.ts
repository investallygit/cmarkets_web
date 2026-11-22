import { describe, expect, it } from 'vitest'
import { cmarketCurveId, rateAt, TENOR_YEARS } from './zeroCurve'

describe('rateAt', () => {
  const tenors = [
    { years: TENOR_YEARS['1Y'], ratePct: 5.1 },
    { years: TENOR_YEARS['3M'], ratePct: 4.6 },
    { years: TENOR_YEARS['2Y'], ratePct: 5.55 },
    { years: TENOR_YEARS['3Y'], ratePct: 5.85 },
  ]

  it('reads the tenors at the cash-flow dates of ECMR 6.25% 2029, linearly between them', () => {
    expect(
      [0.0137, 1.0137, 2.0137, 3.0137].map((years) => rateAt(tenors, years)?.toFixed(4)),
    ).toEqual(['4.6000', '5.1062', '5.5541', '5.8500'])
  })

  it('keeps the end points flat beyond them and has no rate without points', () => {
    expect(rateAt(tenors, 0)).toBe(4.6)
    expect(rateAt(tenors, 10)).toBe(5.85)
    expect(rateAt(tenors, 0.625)).toBeCloseTo(4.85, 12)
    expect(rateAt([], 1)).toBeNull()
  })

  it("names CMarket's curve of a country", () => {
    expect(cmarketCurveId('CM')).toBe('cmkt-CM')
  })
})
