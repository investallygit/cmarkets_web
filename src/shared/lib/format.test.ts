import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatDate,
  formatNumber,
  formatPercent,
  formatSigned,
  formatTime,
  toMarketDay,
} from './format'

const NBSP = '\u00a0'

describe('number formats (spec section 8)', () => {
  it('follows the user language', () => {
    expect(formatNumber(52500.25, 'fr')).toBe(`52${NBSP}500,25`)
    expect(formatNumber(52500.25, 'en')).toBe('52,500.25')
    expect(formatNumber(52500, 'en', 0)).toBe('52,500')
  })

  it('signs changes explicitly', () => {
    expect(formatSigned(5.39, 'en')).toBe('+5.39')
    expect(formatSigned(-3.42, 'en')).toBe('-3.42')
    expect(formatSigned(-0.001, 'en')).toBe('0.00')
    expect(formatSigned(5.39, 'en', 2, false)).toBe('5.39')
  })

  it('formats percentages per language', () => {
    expect(formatPercent(0.42, 'en')).toBe('+0.42%')
    expect(formatPercent(-0.51, 'en')).toBe('-0.51%')
    expect(formatPercent(0.42, 'fr')).toBe(`+0,42${NBSP}%`)
  })

  it('compacts large amounts', () => {
    expect(formatCompact(148_200_000, 'en')).toBe(`148.2${NBSP}M`)
    expect(formatCompact(1_214_600_000_000, 'fr')).toBe(`1${NBSP}214,6${NBSP}Md`)
  })
})

describe('dates and times', () => {
  it('uses DD/MM/YYYY in Douala time for both languages', () => {
    // 23:30 UTC is already the next day in Douala (UTC+1).
    expect(formatDate('2026-10-29T23:30:00Z')).toBe('30/10/2026')
    expect(toMarketDay('2026-10-29T23:30:00Z')).toBe('2026-10-30')
  })

  it('shows the session clock in Douala time', () => {
    expect(formatTime('2026-10-28T09:42:15Z', undefined, true)).toBe('10:42:15')
    expect(formatTime('2026-10-28T09:42:15Z')).toBe('10:42')
  })
})
