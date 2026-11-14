import { describe, expect, it } from 'vitest'
import {
  answerSide,
  formatCountdown,
  formatFace,
  formatQuote,
  isRequestOpen,
  quotedValue,
  requestStatusAt,
  shortNumber,
} from './rfqDisplay'

const NBSP = '\u00a0'
const at = (iso: string) => Date.parse(iso)

describe('formatQuote', () => {
  it('writes a price or a rate as entered, two decimals at least, four at most', () => {
    expect(formatQuote(100.2, 'en')).toBe('100.20')
    expect(formatQuote(100.205, 'en')).toBe('100.205')
    expect(formatQuote(97.0797, 'en')).toBe('97.0797')
    expect(formatQuote(6.05, 'fr')).toBe('6,05')
    expect(formatQuote(97.07971, 'en')).toBe('97.0797')
  })
})

describe('formatFace', () => {
  it('writes the face amounts as screen 22 does, a decimal only when needed', () => {
    expect(formatFace(500_000_000, 'en')).toBe(`500${NBSP}M`)
    expect(formatFace(1_000_000_000, 'en')).toBe(`1${NBSP}Bn`)
    expect(formatFace(1_500_000_000, 'fr')).toBe(`1,5${NBSP}Md`)
  })
})

describe('formatCountdown', () => {
  it('counts down to the second, the hours past an hour, zero once over', () => {
    expect(formatCountdown(171_000)).toBe('02:51')
    expect(formatCountdown(170_200)).toBe('02:51')
    expect(formatCountdown(3_725_000)).toBe('1:02:05')
    expect(formatCountdown(-5_000)).toBe('00:00')
  })
})

describe('a request', () => {
  const open = { status: 'answersReceived' as const, expiresAt: '2026-10-29T09:53:00Z' }

  it('stays open until its confirmation ends, then reads as expired', () => {
    expect(isRequestOpen(open, at('2026-10-29T09:52:59Z'))).toBe(true)
    expect(isRequestOpen(open, at('2026-10-29T09:53:00Z'))).toBe(false)
    expect(requestStatusAt(open, at('2026-10-29T09:53:00Z'))).toBe('expired')
    expect(requestStatusAt({ ...open, status: 'confirmed' }, at('2026-10-29T10:00:00Z'))).toBe(
      'confirmed',
    )
  })

  it('is answered from the other side, in its quote type', () => {
    expect(answerSide('buy')).toBe('sell')
    expect(answerSide('sell')).toBe('buy')
    expect(quotedValue('price', { price: 100.2, ratePct: 6.02 })).toBe(100.2)
    expect(quotedValue('rate', { price: 97.07, ratePct: 6.05 })).toBe(6.05)
  })

  it('shortens its number as the blotter writes it', () => {
    expect(shortNumber('RFQ-261029-0042')).toBe('RFQ-0042')
    expect(shortNumber('ACC-261029-0017')).toBe('ACC-0017')
  })
})
