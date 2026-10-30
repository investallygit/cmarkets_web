import { describe, expect, it } from 'vitest'
import { isRecommendation, ratingTone, upsidePct } from './rating'

describe('publication ratings', () => {
  it('colours a rating by its direction', () => {
    expect(
      ['buy', 'positive', 'hold', 'stable', 'sell', 'negative'].map((rating) =>
        ratingTone(rating as never),
      ),
    ).toEqual(['up', 'up', 'neutral', 'neutral', 'down', 'down'])
  })

  it('tells a recommendation from an outlook', () => {
    expect(isRecommendation('hold')).toBe(true)
    expect(isRecommendation('stable')).toBe(false)
    expect(isRecommendation(null)).toBe(false)
  })

  it('gives the upside of the screen 8 mockup: 58,000 against 52,500 is +10.5%', () => {
    expect(upsidePct(58_000, 52_500)?.toFixed(1)).toBe('10.5')
    expect(upsidePct(null, 52_500)).toBeNull()
  })
})
