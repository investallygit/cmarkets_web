import type { PortfolioTab } from '@/shared/routes/paths'
import type { WorkspaceItem } from '@/shared/ui/Workspace'

/**
 * Default panels of each tab, in grid units (12 columns x 26 rows). Positions follows the
 * screen 5 mockup (spec section 9):
 *
 *   positions  positions  | performance
 *   allocation | risk     | income
 */
// prettier-ignore
export const PORTFOLIO_LAYOUTS: Record<PortfolioTab, readonly WorkspaceItem[]> = {
  positions: [
    { i: 'positions', x: 0, y: 0, w: 8, h: 15, minW: 5, minH: 6 },
    { i: 'performance', x: 8, y: 0, w: 4, h: 15, minW: 3, minH: 8 },
    { i: 'allocation', x: 0, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
    { i: 'risk', x: 4, y: 15, w: 4, h: 11, minW: 3, minH: 8 },
    { i: 'income', x: 8, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
  ],
  transactions: [{ i: 'transactions', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 8 }],
  performance: [
    { i: 'chart', x: 0, y: 0, w: 12, h: 17, minW: 4, minH: 10 },
    { i: 'returns', x: 0, y: 17, w: 12, h: 9, minW: 4, minH: 6 },
  ],
  risk: [
    { i: 'metrics', x: 0, y: 0, w: 4, h: 26, minW: 3, minH: 10 },
    { i: 'limits', x: 4, y: 0, w: 8, h: 9, minW: 4, minH: 6 },
    { i: 'issuers', x: 4, y: 9, w: 4, h: 17, minW: 3, minH: 6 },
    { i: 'maturities', x: 8, y: 9, w: 4, h: 17, minW: 3, minH: 6 },
  ],
  income: [
    { i: 'upcoming', x: 0, y: 0, w: 6, h: 26, minW: 3, minH: 6 },
    { i: 'received', x: 6, y: 0, w: 6, h: 26, minW: 3, minH: 6 },
  ],
  reports: [
    { i: 'form', x: 0, y: 0, w: 4, h: 26, minW: 3, minH: 12 },
    { i: 'reports', x: 4, y: 0, w: 8, h: 7, minW: 4, minH: 4 },
    { i: 'preview', x: 4, y: 7, w: 8, h: 19, minW: 4, minH: 8 },
  ],
}

/** Without client reports (not a Portfolio manager), the Reports tab only says so. */
export const LOCKED_REPORTS_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'form', x: 0, y: 0, w: 12, h: 26, minW: 4, minH: 4 },
]

/** Layout key of a tab for /me/layouts/{screen}: PORT, PORT-RISK... */
export function layoutKey(tab: PortfolioTab): string {
  return tab === 'positions' ? 'PORT' : `PORT-${tab.toUpperCase()}`
}
