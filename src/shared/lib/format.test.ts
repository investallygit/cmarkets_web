import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatDate,
  formatFileSize,
  formatIsoDate,
  formatMonth,
  formatNumber,
  formatPercent,
  formatSigned,
  formatTime,
  formatUtcOffset,
  formatWeekday,
  isTimeZone,
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

  it('formats file sizes per language', () => {
    expect(formatFileSize(512, 'en')).toBe(`512${NBSP}B`)
    expect(formatFileSize(1_258_291, 'en')).toBe(`1.2${NBSP}MB`)
    expect(formatFileSize(1_258_291, 'fr')).toBe(`1,2${NBSP}Mo`)
  })
})

describe('dates and times', () => {
  it('uses DD/MM/YYYY in Douala time for both languages', () => {
    // 23:30 UTC is already the next day in Douala (UTC+1).
    expect(formatDate('2026-10-29T23:30:00Z')).toBe('30/10/2026')
    expect(toMarketDay('2026-10-29T23:30:00Z')).toBe('2026-10-30')
  })

  it('shows calendar dates as DD/MM/YYYY without a time zone shift', () => {
    expect(formatIsoDate('2026-10-30')).toBe('30/10/2026')
  })

  it('names the day of the week in the user language', () => {
    expect(formatWeekday('2026-10-30', 'en')).toBe('Fri')
    expect(formatWeekday('2026-10-30', 'fr', 'long')).toBe('vendredi')
  })

  it('shows the session clock in Douala time', () => {
    expect(formatTime('2026-10-28T09:42:15Z', undefined, true)).toBe('10:42:15')
    expect(formatTime('2026-10-28T09:42:15Z')).toBe('10:42')
  })

  it("shows a moment in the user's time zone, a calendar day as it is", () => {
    expect(formatTime('2026-10-28T09:42:15Z', 'America/New_York')).toBe('05:42')
    expect(formatDate('2026-10-29T02:00:00Z', 'America/New_York')).toBe('28/10/2026')
    // A calendar day such as a reference date stays the same day in New York.
    expect(formatDate('2026-10-28', 'America/New_York')).toBe('28/10/2026')
    expect(toMarketDay('2026-10-28', 'Asia/Dubai')).toBe('2026-10-28')
  })

  it('names the offset of a time zone and refuses an unknown one', () => {
    expect(formatUtcOffset('Africa/Douala')).toBe('UTC+01:00')
    expect(formatUtcOffset('Europe/Paris', '2026-07-01T12:00:00Z')).toBe('UTC+02:00')
    expect(formatUtcOffset('America/New_York', '2026-12-01T12:00:00Z')).toBe('UTC\u221205:00')
    expect(isTimeZone('Europe/Paris')).toBe(true)
    expect(isTimeZone('Mars/Olympus')).toBe(false)
  })
})

describe('month names', () => {
  it('names a month in the user language', () => {
    expect(formatMonth('2026-10', 'en')).toBe('October 2026')
    expect(formatMonth('2026-02', 'fr')).toBe('février 2026')
  })
})
