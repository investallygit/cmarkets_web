import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 27 mockup (spec section 9) in grid units, 12 columns x 24 rows, under the counters:
 *
 *   agreements to approve and latest decisions | agreement detail
 *   trader links | approval settings             | agreement detail
 */
export const SVT_APPROVAL_LAYOUT: readonly ScreenPanel[] = [
  { i: 'approvals', name: 'svtApprovals', x: 0, y: 0, w: 8, h: 13, minW: 5, minH: 8 },
  { i: 'links', name: 'traderLinks', x: 0, y: 13, w: 4, h: 11, minW: 3, minH: 8 },
  { i: 'settings', name: 'svtSettings', x: 4, y: 13, w: 4, h: 11, minW: 3, minH: 8 },
  { i: 'agreement', name: 'svtAgreement', x: 8, y: 0, w: 4, h: 24, minW: 3, minH: 12 },
]
