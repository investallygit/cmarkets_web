import type { SecurityFunction } from '@/shared/routes/paths'
import type { WorkspaceItem } from '@/shared/ui/Workspace'

/**
 * Default panels of each tab, in grid units (12 columns x 26 rows). The DES tab follows the
 * screen 2 mockup (spec section 9):
 *
 *   chart    chart    | orderbook
 *   chart    chart    | trades
 *   keydata | income  | documents
 *
 * "income" holds the dividends of an equity or the redemption schedule of a bond. FA shows the
 * comparison and the statements of the screen 3 mockup, with the ratios and the price chart.
 */
// prettier-ignore
export const PROFILE_LAYOUTS: Record<SecurityFunction, readonly WorkspaceItem[]> = {
  des: [
    { i: 'chart', x: 0, y: 0, w: 8, h: 16, minW: 4, minH: 8 },
    { i: 'orderbook', x: 8, y: 0, w: 4, h: 8, minW: 3, minH: 5 },
    { i: 'trades', x: 8, y: 8, w: 4, h: 8, minW: 3, minH: 4 },
    { i: 'keydata', x: 0, y: 16, w: 4, h: 10, minW: 3, minH: 5 },
    { i: 'income', x: 4, y: 16, w: 4, h: 10, minW: 3, minH: 4 },
    { i: 'documents', x: 8, y: 16, w: 4, h: 10, minW: 3, minH: 4 },
  ],
  gp: [{ i: 'chart', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 10 }],
  fa: [
    { i: 'comparison', x: 0, y: 0, w: 4, h: 15, minW: 3, minH: 8 },
    { i: 'ratios', x: 0, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
    { i: 'statements', x: 4, y: 0, w: 8, h: 10, minW: 4, minH: 6 },
    { i: 'summary', x: 4, y: 10, w: 8, h: 6, minW: 4, minH: 4 },
    { i: 'chart', x: 4, y: 16, w: 8, h: 10, minW: 4, minH: 8 },
  ],
  dvd: [
    { i: 'dividends', x: 0, y: 0, w: 8, h: 11, minW: 4, minH: 4 },
    { i: 'keydata', x: 8, y: 0, w: 4, h: 11, minW: 3, minH: 5 },
    { i: 'chart', x: 0, y: 11, w: 12, h: 15, minW: 4, minH: 8 },
  ],
  n: [
    { i: 'list', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'article', x: 5, y: 0, w: 7, h: 26, minW: 3, minH: 6 },
  ],
  doc: [
    { i: 'list', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'viewer', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 10 },
  ],
  hds: [
    { i: 'shareholders', x: 0, y: 0, w: 7, h: 11, minW: 4, minH: 4 },
    { i: 'keydata', x: 7, y: 0, w: 5, h: 11, minW: 3, minH: 5 },
    { i: 'chart', x: 0, y: 11, w: 12, h: 15, minW: 4, minH: 8 },
  ],
  ana: [
    { i: 'list', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
    { i: 'preview', x: 7, y: 0, w: 5, h: 17, minW: 3, minH: 8 },
    { i: 'analyst', x: 7, y: 17, w: 5, h: 9, minW: 3, minH: 5 },
  ],
}

/** Layout key of a tab for /me/layouts/{screen}: DES, DES-GP, DES-DVD... */
export function layoutKey(fn: SecurityFunction): string {
  return fn === 'des' ? 'DES' : `DES-${fn.toUpperCase()}`
}
