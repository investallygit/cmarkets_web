import { describe, expect, it } from 'vitest'
import { crossDecimals, ecbDecimals } from './fxDecimals'

describe('ecbDecimals', () => {
  it("writes the ECB's rates as the mockup does: their own decimals, two to four", () => {
    const rates = [1.0848, 0.8371, 163.4, 19.412, 91.25, 37.6, 6.082, 17123.45, 1500, 0.837105]
    expect(rates.map(ecbDecimals)).toEqual([4, 4, 2, 3, 2, 2, 3, 2, 2, 4])
  })
})

describe('crossDecimals', () => {
  it('keeps two decimals, four below one', () => {
    expect([604.68, 1.08, 1, 0.9218, 0.0015, -0.5].map(crossDecimals)).toEqual([2, 2, 2, 4, 4, 4])
  })
})
