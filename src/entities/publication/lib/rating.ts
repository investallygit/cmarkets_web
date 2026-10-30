import type { PublicationRating, Recommendation } from '@/shared/api/contracts'
import { RECOMMENDATIONS } from '../config/research'

export type RatingTone = 'up' | 'down' | 'neutral'

/** Buy and a positive outlook in green, Sell and a negative one in red (spec section 9). */
export function ratingTone(rating: PublicationRating): RatingTone {
  if (rating === 'buy' || rating === 'positive') return 'up'
  if (rating === 'sell' || rating === 'negative') return 'down'
  return 'neutral'
}

export function isRecommendation(rating: PublicationRating | null): rating is Recommendation {
  return RECOMMENDATIONS.some((recommendation) => recommendation === rating)
}

/** Upside of a target price from the reference price, in percent. */
export function upsidePct(
  targetPrice: number | null,
  referencePrice: number | null,
): number | null {
  return targetPrice && referencePrice ? (targetPrice / referencePrice - 1) * 100 : null
}
