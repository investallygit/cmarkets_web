import type { RatioKey } from '@/shared/api/contracts'

/** The ratios of spec section 3, in display order: valuation, profitability, leverage, margins. */
export const RATIO_KEYS: readonly RatioKey[] = [
  'pe',
  'dividendYield',
  'priceToBook',
  'roe',
  'netDebtToEquity',
  'ebitdaMargin',
  'netMargin',
]

/** Multiples read "11.4x" as in the screen 3 mockup; the other ratios are percentages. */
export const RATIO_FORMATS: Record<RatioKey, { kind: 'multiple' | 'percent'; decimals: number }> = {
  pe: { kind: 'multiple', decimals: 1 },
  dividendYield: { kind: 'percent', decimals: 1 },
  priceToBook: { kind: 'multiple', decimals: 2 },
  roe: { kind: 'percent', decimals: 1 },
  netDebtToEquity: { kind: 'multiple', decimals: 1 },
  ebitdaMargin: { kind: 'percent', decimals: 1 },
  netMargin: { kind: 'percent', decimals: 1 },
}
