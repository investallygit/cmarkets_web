import { describe, expect, it } from 'vitest'
import { compactDate, isMade, millions, monthOf, shiftMonth, shortSha } from './reportDisplay'

const format = (value: number, decimals: number) =>
  value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

describe('reportDisplay', () => {
  it('moves from month to month across the years', () => {
    expect(monthOf('2026-10-29')).toBe('2026-10')
    expect(shiftMonth('2026-10', -1)).toBe('2026-09')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('writes the face amounts in millions, a tenth below a whole one', () => {
    expect(millions(2_150_000_000, format)).toBe('2,150')
    expect(millions(12_340_000, format)).toBe('12.3')
    expect(millions(0, format)).toBe('0')
  })

  it('shortens a fingerprint and dates a file name as the API does', () => {
    expect(shortSha('7f3a0000000000000000000000000000000000000000000000000000000000c91e')).toBe(
      '7f3a…c91e',
    )
    expect(compactDate('2026-10-29')).toBe('20261029')
  })

  it('offers Resend for a day made, Send now otherwise', () => {
    expect(isMade('sent')).toBe(true)
    expect(isMade('failed')).toBe(true)
    expect(isMade('scheduled')).toBe(false)
    expect(isMade('skipped')).toBe(false)
  })
})
