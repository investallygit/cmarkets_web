import type { PortfolioTab } from '@/shared/routes/paths'
import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Default panels of each tab, in grid units (12 columns x 26 rows). Positions follows the
 * screen 5 mockup (spec section 9):
 *
 *   positions  positions  | performance
 *   allocation | risk     | income
 */
// prettier-ignore
export const PORTFOLIO_LAYOUTS: Record<PortfolioTab, readonly ScreenPanel[]> = {
  positions: [
    { i: 'positions', name: 'positions', x: 0, y: 0, w: 8, h: 15, minW: 5, minH: 6 },
    { i: 'performance', name: 'performance', x: 8, y: 0, w: 4, h: 15, minW: 3, minH: 8 },
    { i: 'allocation', name: 'allocation', x: 0, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
    { i: 'risk', name: 'risk', x: 4, y: 15, w: 4, h: 11, minW: 3, minH: 8 },
    { i: 'income', name: 'upcomingIncome', x: 8, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
  ],
  transactions: [{ i: 'transactions', name: 'transactions', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 8 }],
  performance: [
    { i: 'chart', name: 'performance', x: 0, y: 0, w: 12, h: 17, minW: 4, minH: 10 },
    { i: 'returns', name: 'returns', x: 0, y: 17, w: 12, h: 9, minW: 4, minH: 6 },
  ],
  risk: [
    { i: 'metrics', name: 'risk', x: 0, y: 0, w: 4, h: 26, minW: 3, minH: 10 },
    { i: 'limits', name: 'limits', x: 4, y: 0, w: 8, h: 9, minW: 4, minH: 6 },
    { i: 'issuers', name: 'issuers', x: 4, y: 9, w: 4, h: 17, minW: 3, minH: 6 },
    { i: 'maturities', name: 'maturities', x: 8, y: 9, w: 4, h: 17, minW: 3, minH: 6 },
  ],
  income: [
    { i: 'upcoming', name: 'upcomingIncome', x: 0, y: 0, w: 6, h: 26, minW: 3, minH: 6 },
    { i: 'received', name: 'receivedIncome', x: 6, y: 0, w: 6, h: 26, minW: 3, minH: 6 },
  ],
  reports: [
    { i: 'form', name: 'newReport', x: 0, y: 0, w: 4, h: 26, minW: 3, minH: 12 },
    { i: 'reports', name: 'reports', x: 4, y: 0, w: 8, h: 7, minW: 4, minH: 4 },
    { i: 'preview', name: 'reportPreview', x: 4, y: 7, w: 8, h: 19, minW: 4, minH: 8 },
  ],
}

/** Without client reports (not a Portfolio manager), the Reports tab only says so. */
export const LOCKED_REPORTS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'form', name: 'newReport', x: 0, y: 0, w: 12, h: 26, minW: 4, minH: 4 },
]

/** Layout key of a tab for /me/layouts/{screen}: PORT, PORT-RISK... */
export function layoutKey(tab: PortfolioTab): string {
  return tab === 'positions' ? 'PORT' : `PORT-${tab.toUpperCase()}`
}
