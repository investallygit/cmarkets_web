import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 28 mockup (spec section 9) in grid units, 12 columns x 26 rows, under the tabs:
 *
 *   universe | objective | correlations
 *   universe | objective | pre-run checks
 */
export const OPT_SETUP_LAYOUT: readonly ScreenPanel[] = [
  { i: 'universe', name: 'optUniverse', x: 0, y: 0, w: 5, h: 26, minW: 4, minH: 10 },
  { i: 'objective', name: 'optObjective', x: 5, y: 0, w: 3, h: 26, minW: 3, minH: 12 },
  { i: 'correlations', name: 'optCorrelations', x: 8, y: 0, w: 4, h: 15, minW: 3, minH: 8 },
  { i: 'checks', name: 'optChecks', x: 8, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
]

/**
 * Screen 29 mockup in grid units, under the indicators:
 *
 *   allocation | frontier
 *   breakdown | constraints and comparison | next steps
 */
export const OPT_RESULT_LAYOUT: readonly ScreenPanel[] = [
  { i: 'allocation', name: 'optAllocation', x: 0, y: 0, w: 6, h: 13, minW: 4, minH: 8 },
  { i: 'frontier', name: 'optFrontier', x: 6, y: 0, w: 6, h: 13, minW: 4, minH: 8 },
  { i: 'breakdown', name: 'optBreakdown', x: 0, y: 13, w: 4, h: 11, minW: 3, minH: 6 },
  { i: 'comparison', name: 'optComparison', x: 4, y: 13, w: 4, h: 11, minW: 3, minH: 6 },
  { i: 'nextSteps', name: 'optNextSteps', x: 8, y: 13, w: 4, h: 11, minW: 3, minH: 6 },
]
