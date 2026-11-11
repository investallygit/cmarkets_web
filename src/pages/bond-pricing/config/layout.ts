import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 16 mockup (spec section 9) in grid units, 12 columns x 26 rows:
 *
 *   inputs | results            | price-yield
 *   inputs | cash-flow schedule | rate sensitivity
 */
export const BOND_PRICING_LAYOUT: readonly ScreenPanel[] = [
  { i: 'inputs', name: 'bondPricingInputs', x: 0, y: 0, w: 3, h: 26, minW: 2, minH: 10 },
  { i: 'results', name: 'bondPricingResults', x: 3, y: 0, w: 6, h: 9, minW: 3, minH: 5 },
  { i: 'cashFlows', name: 'cashFlowSchedule', x: 3, y: 9, w: 6, h: 17, minW: 3, minH: 5 },
  { i: 'priceYield', name: 'priceYield', x: 9, y: 0, w: 3, h: 13, minW: 2, minH: 6 },
  { i: 'sensitivity', name: 'rateSensitivity', x: 9, y: 13, w: 3, h: 13, minW: 2, minH: 6 },
]
