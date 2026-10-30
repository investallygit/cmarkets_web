import { describe, expect, it } from 'vitest'
import { parseDate, parseNumber } from './parse'

describe('parseNumber', () => {
  it('reads French numbers, with or without digit groups', () => {
    expect(parseNumber('52 500,25', 'fr')).toBe(52500.25)
    expect(parseNumber('52\u00a0500,25', 'fr')).toBe(52500.25)
    expect(parseNumber('100\u202f000\u202f000', 'fr')).toBe(100_000_000)
    expect(parseNumber('-0,5', 'fr')).toBe(-0.5)
    expect(parseNumber('101.40', 'fr')).toBe(101.4)
  })

  it('reads English numbers and only accepts commas as digit groups', () => {
    expect(parseNumber('52,500.25', 'en')).toBe(52500.25)
    expect(parseNumber('1234.5', 'en')).toBe(1234.5)
    expect(parseNumber('.5', 'en')).toBe(0.5)
    expect(parseNumber('1,5', 'en')).toBeNull()
    expect(parseNumber('1,23,456', 'en')).toBeNull()
  })

  it('keeps a number being typed and rejects anything else', () => {
    expect(parseNumber('101.', 'en')).toBe(101)
    expect(parseNumber('+3', 'en')).toBe(3)
    expect(parseNumber('', 'en')).toBeNull()
    expect(parseNumber('-', 'en')).toBeNull()
    expect(parseNumber('1e5', 'en')).toBeNull()
    expect(parseNumber('1.000,5', 'fr')).toBeNull()
    expect(parseNumber('12 abc', 'fr')).toBeNull()
  })
})

describe('parseDate', () => {
  it('reads DD/MM/YYYY as an ISO date', () => {
    expect(parseDate('30/10/2026')).toBe('2026-10-30')
    expect(parseDate('4/11/2029')).toBe('2029-11-04')
    expect(parseDate(' 04-11-2029 ')).toBe('2029-11-04')
  })

  it('rejects dates that do not exist', () => {
    expect(parseDate('31/02/2026')).toBeNull()
    expect(parseDate('29/02/2027')).toBeNull()
    expect(parseDate('29/02/2028')).toBe('2028-02-29')
    expect(parseDate('10/30/2026')).toBeNull()
    expect(parseDate('2026-10-30')).toBeNull()
  })
})
