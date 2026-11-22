import { describe, expect, it } from 'vitest'
import { tradesAtFixing } from './fixing'

describe('tradesAtFixing', () => {
  it('holds for BVMAC, not for the European and US exchanges', () => {
    expect(tradesAtFixing({ exchange: 'BVMAC' })).toBe(true)
    expect(tradesAtFixing({ exchange: 'PA' })).toBe(false)
    expect(tradesAtFixing({ exchange: 'US' })).toBe(false)
  })
})
