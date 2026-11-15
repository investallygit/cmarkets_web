import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { reasonText } from './reasonText'

const t = ((key: string) => `[${key}]`) as unknown as TFunction

describe('reasonText', () => {
  it('words a reason with its comment, and "other" by its text alone', () => {
    expect(reasonText(t, { reason: 'securitiesNotAvailable', comment: null })).toBe(
      '[svt.reasons.securitiesNotAvailable]',
    )
    expect(reasonText(t, { reason: 'offMarketPrice', comment: '2% off the curve' })).toBe(
      '[svt.reasons.offMarketPrice] (2% off the curve)',
    )
    expect(reasonText(t, { reason: 'other', comment: 'Settlement account under review' })).toBe(
      'Settlement account under review',
    )
    expect(reasonText(t, { reason: null, comment: null })).toBe('')
  })
})
