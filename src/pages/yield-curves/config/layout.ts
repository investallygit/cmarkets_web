import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 4 mockup (spec section 9) in grid units, 12 columns x 26 rows:
 *
 *   curves   curves | calculator
 *   auctions auctions auctions
 */
export const YIELD_CURVES_LAYOUT: readonly ScreenPanel[] = [
  { i: 'curves', name: 'yieldCurves', x: 0, y: 0, w: 8, h: 16, minW: 4, minH: 8 },
  { i: 'calculator', name: 'bondCalculator', x: 8, y: 0, w: 4, h: 16, minW: 3, minH: 10 },
  { i: 'auctions', name: 'auctions', x: 0, y: 16, w: 12, h: 10, minW: 6, minH: 4 },
]
