import { describe, expect, it } from 'vitest'
import { auctionYears, yearSpan } from '../model/filters'
import { billions } from './amounts'

describe("AUC's amounts and period", () => {
  it('writes millions of XAF in billions', () => {
    expect([billions(20_000), billions(86_500), billions(5_900)]).toEqual([20, 86.5, 5.9])
  })

  it('offers this year and the two before, a year from its first day to its last', () => {
    expect(auctionYears(2026)).toEqual([2026, 2025, 2024])
    expect(yearSpan(2025)).toEqual({ from: '2025-01-01', to: '2025-12-31' })
  })
})
