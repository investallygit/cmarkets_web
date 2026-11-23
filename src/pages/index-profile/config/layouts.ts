import type { IndexFunction } from '@/shared/api/contracts'
import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Default panels of each tab of the index profile, in grid units (12 columns x 26 rows). DES
 * follows the screen 31 mockup (spec section 9, fifth version):
 *
 *   value        value        | sessions
 *   description  description  | sessions
 *   constituents | performance | documents
 *
 * GP, the value alone, 1 month to 10 years; MEMB, the composition on a date; PERF, the figures and
 * the returns by month; DOC, the documents beside the viewer.
 */
// prettier-ignore
export const INDEX_LAYOUTS: Record<IndexFunction, readonly ScreenPanel[]> = {
  des: [
    { i: 'value', name: 'indexValue', x: 0, y: 0, w: 8, h: 12, minW: 4, minH: 8 },
    { i: 'description', name: 'securityDescription', x: 0, y: 12, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'sessions', name: 'indexSessions', x: 8, y: 0, w: 4, h: 17, minW: 3, minH: 6 },
    { i: 'constituents', name: 'constituents', x: 0, y: 17, w: 5, h: 9, minW: 3, minH: 5 },
    { i: 'performance', name: 'indexPerformance', x: 5, y: 17, w: 3, h: 9, minW: 2, minH: 5 },
    { i: 'documents', name: 'methodologyNotices', x: 8, y: 17, w: 4, h: 9, minW: 3, minH: 4 },
  ],
  gp: [{ i: 'value', name: 'indexValue', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 10 }],
  memb: [
    { i: 'constituents', name: 'constituents', x: 0, y: 0, w: 8, h: 26, minW: 4, minH: 8 },
    { i: 'documents', name: 'methodologyNotices', x: 8, y: 0, w: 4, h: 26, minW: 3, minH: 6 },
  ],
  perf: [
    { i: 'performance', name: 'indexPerformance', x: 0, y: 0, w: 4, h: 12, minW: 3, minH: 6 },
    { i: 'value', name: 'indexValue', x: 4, y: 0, w: 8, h: 12, minW: 4, minH: 8 },
    { i: 'returns', name: 'indexReturns', x: 0, y: 12, w: 12, h: 14, minW: 6, minH: 6 },
  ],
  doc: [
    { i: 'list', name: 'methodologyNotices', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'viewer', name: 'document', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 10 },
  ],
}

/** The saved layout of each tab: "IDX", "IDX-GP"... */
export function indexLayoutKey(fn: IndexFunction): string {
  return fn === 'des' ? 'IDX' : `IDX-${fn.toUpperCase()}`
}
