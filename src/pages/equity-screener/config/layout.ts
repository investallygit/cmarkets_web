import type { WorkspaceItem } from '@/shared/ui/Workspace'

/**
 * Screen 3 mockup (spec section 9) in grid units, 12 columns x 26 rows:
 *
 *   criteria | results    results
 *   criteria | comparison | statements
 *   criteria | comparison | summary
 */
export const EQUITY_SCREENER_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'criteria', x: 0, y: 0, w: 3, h: 26, minW: 2, minH: 10 },
  { i: 'results', x: 3, y: 0, w: 9, h: 8, minW: 4, minH: 5 },
  { i: 'comparison', x: 3, y: 8, w: 4, h: 18, minW: 3, minH: 8 },
  { i: 'statements', x: 7, y: 8, w: 5, h: 10, minW: 3, minH: 6 },
  { i: 'summary', x: 7, y: 18, w: 5, h: 8, minW: 3, minH: 4 },
]
