import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 23 mockup (spec section 9) in grid units, 12 columns x 26 rows, under the RFQ's tabs:
 *
 *   filters | the agreements, their count and total face | the agreement picked
 */
export const AGREEMENTS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'filters', name: 'rfqAgreementFilters', x: 0, y: 0, w: 2, h: 26, minW: 2, minH: 12 },
  { i: 'list', name: 'rfqAgreements', x: 2, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
  { i: 'detail', name: 'rfqAgreement', x: 9, y: 0, w: 3, h: 26, minW: 3, minH: 10 },
]
