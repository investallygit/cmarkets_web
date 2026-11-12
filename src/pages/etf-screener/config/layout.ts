import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 15 mockup (spec section 9) in grid units, 12 columns x 26 rows:
 *
 *   criteria | results
 *   criteria | profile of the selected ETF
 */
export const ETF_SCREENER_LAYOUT: readonly ScreenPanel[] = [
  { i: 'criteria', name: 'etfCriteria', x: 0, y: 0, w: 3, h: 26, minW: 2, minH: 10 },
  { i: 'results', name: 'etfResults', x: 3, y: 0, w: 9, h: 11, minW: 4, minH: 5 },
  { i: 'profile', name: 'etfProfile', x: 3, y: 11, w: 9, h: 15, minW: 4, minH: 6 },
]
