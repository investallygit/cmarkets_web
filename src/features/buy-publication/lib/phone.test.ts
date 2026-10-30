import { describe, expect, it } from 'vitest'
import { isPhoneNumber } from './phone'

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
