import type { WorkspaceItem } from '@/shared/ui/Workspace'

/**
 * Screen 1 mockup (spec section 9) in grid units: three columns of 4, 26 rows.
 * Heights fit each table's rows at 1600 x 900 (22 px rows plus title bar and header).
 *
 *   indices   | chart    | movers
 *   watchlist | chart    | movers
 *   watchlist | rates    | news
 *   calendar  calendar   | news
 *   alerts    alerts     | summary
 */
export const MARKET_DASHBOARD_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'indices', x: 0, y: 0, w: 4, h: 7, minW: 3, minH: 4 },
  { i: 'chart', x: 4, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
  { i: 'movers', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 5 },
  { i: 'watchlist', x: 0, y: 7, w: 4, h: 9, minW: 3, minH: 5 },
  { i: 'rates', x: 4, y: 10, w: 4, h: 6, minW: 3, minH: 4 },
  { i: 'news', x: 8, y: 10, w: 4, h: 12, minW: 3, minH: 5 },
  { i: 'calendar', x: 0, y: 16, w: 8, h: 6, minW: 4, minH: 3 },
  { i: 'alerts', x: 0, y: 22, w: 8, h: 4, minW: 4, minH: 3 },
  { i: 'summary', x: 8, y: 22, w: 4, h: 4, minW: 3, minH: 3 },
]
