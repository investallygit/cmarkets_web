import { describe, expect, it } from 'vitest'
import { isMobileMoneyNumber, isPhoneNumber } from './phone'

describe('isPhoneNumber', () => {
  it('accepts a CEMAC mobile number written with spaces or dots', () => {
    expect(isPhoneNumber('+237 6 70 12 34 56')).toBe(true)
    expect(isPhoneNumber('241.06.12.34.56')).toBe(true)
  })

  it('refuses letters and short numbers', () => {
    expect(isPhoneNumber('6 70 12')).toBe(false)
    expect(isPhoneNumber('+237 6 7O 12 34 56')).toBe(false)
  })
})

describe('isMobileMoneyNumber', () => {
  it('accepts a number of the six CEMAC countries with its code', () => {
    expect(isMobileMoneyNumber('+237 6 70 12 34 56')).toBe(true)
    expect(isMobileMoneyNumber('+241 06 12 34 56')).toBe(true)
    expect(isMobileMoneyNumber('00242 06 612 3456')).toBe(true)
  })

  it('refuses a number of elsewhere, or without its country code (B71)', () => {
    expect(isMobileMoneyNumber('+33 6 12 34 56 78')).toBe(false)
    expect(isMobileMoneyNumber('+225 07 12 34 56 78')).toBe(false)
    expect(isMobileMoneyNumber('6 70 12 34 56')).toBe(false)
  })
})
