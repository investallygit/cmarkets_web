import { describe, expect, it } from 'vitest'
import { amountsFromNet, amountsFromTotal, yearlySavingPct } from './billing'

describe('invoice amounts', () => {
  it('adds the VAT to a price per user', () => {
    // Four users of the Professional plan at XAF 70,000 a month, VAT 19.25%.
    expect(amountsFromNet(70_000, 4, 19.25)).toEqual({
      amount: 280_000,
      taxAmount: 53_900,
      total: 333_900,
    })
  })

  it('finds the VAT inside a price that includes it', () => {
    expect(amountsFromTotal(15_000, 19.25)).toEqual({
      amount: 12_579,
      taxAmount: 2_421,
      total: 15_000,
    })
  })

  it('gives the saving of a yearly price', () => {
    expect(yearlySavingPct(70_000, 700_000)).toBe(17)
    expect(yearlySavingPct(0, 0)).toBe(0)
  })
})
