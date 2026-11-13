import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 26 mockup (spec section 9) in grid units, 12 columns x 26 rows, under the parity:
 *
 *   crosses   crosses   | chart
 *   converter | matrix  | euro
 */
export const FX_DASHBOARD_LAYOUT: readonly ScreenPanel[] = [
  { i: 'crosses', name: 'fxCrosses', x: 0, y: 0, w: 7, h: 17, minW: 5, minH: 8 },
  { i: 'chart', name: 'fxChart', x: 7, y: 0, w: 5, h: 17, minW: 3, minH: 8 },
  { i: 'converter', name: 'fxConverter', x: 0, y: 17, w: 4, h: 9, minW: 3, minH: 7 },
  { i: 'matrix', name: 'fxMatrix', x: 4, y: 17, w: 4, h: 9, minW: 3, minH: 5 },
  { i: 'euro', name: 'euroBenchmarks', x: 8, y: 17, w: 4, h: 9, minW: 3, minH: 5 },
]
