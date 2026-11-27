import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * DEBT, the screen 35 mockup (sixth version) in grid units, 12 columns x 28 rows, under the
 * country bar and the indicators:
 *
 *   redemption schedule       | CEMAC comparison
 *   outstanding securities    | ratings and documents
 */
export const DEBT_LAYOUT: readonly ScreenPanel[] = [
  { i: 'schedule', name: 'debtSchedule', x: 0, y: 0, w: 7, h: 13, minW: 4, minH: 6 },
  { i: 'compare', name: 'debtCompare', x: 7, y: 0, w: 5, h: 13, minW: 3, minH: 6 },
  { i: 'securities', name: 'debtSecurities', x: 0, y: 13, w: 7, h: 15, minW: 4, minH: 6 },
  { i: 'documents', name: 'debtDocuments', x: 7, y: 13, w: 5, h: 15, minW: 3, minH: 6 },
]
