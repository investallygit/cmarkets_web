import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 25 mockup (spec section 9) in grid units, 12 columns x 26 rows, under the country bar and
 * the key indicator tiles:
 *
 *   chart  chart  | rates
 *   cemac comparison
 */
export const MACRO_DASHBOARD_LAYOUT: readonly ScreenPanel[] = [
  { i: 'chart', name: 'macroChart', x: 0, y: 0, w: 7, h: 15, minW: 4, minH: 8 },
  { i: 'rates', name: 'sovereignRates', x: 7, y: 0, w: 5, h: 15, minW: 3, minH: 6 },
  { i: 'table', name: 'cemacComparison', x: 0, y: 15, w: 12, h: 11, minW: 6, minH: 6 },
]
