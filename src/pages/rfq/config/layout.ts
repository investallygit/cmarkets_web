import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 22 mockup (spec section 9) in grid units, 12 columns x 26 rows, under the tabs:
 *
 *   new request | my request | my SVTs
 *   new request | open requests and the answer form | today's blotter
 */
export const RFQ_LAYOUT: readonly ScreenPanel[] = [
  { i: 'newRequest', name: 'rfqNewRequest', x: 0, y: 0, w: 3, h: 26, minW: 3, minH: 12 },
  { i: 'myRequest', name: 'rfqMyRequest', x: 3, y: 0, w: 6, h: 14, minW: 4, minH: 8 },
  { i: 'board', name: 'rfqBoard', x: 3, y: 14, w: 6, h: 12, minW: 4, minH: 8 },
  { i: 'mySvts', name: 'mySvts', x: 9, y: 0, w: 3, h: 14, minW: 3, minH: 8 },
  { i: 'blotter', name: 'rfqBlotter', x: 9, y: 14, w: 3, h: 12, minW: 3, minH: 6 },
]

/**
 * The same screen for a reader of its organisation's requests, its CEO (ROADMAP decision 18): the
 * organisation's requests, as "My request" shows them, and its blotter.
 */
export const RFQ_READER_LAYOUT: readonly ScreenPanel[] = [
  { i: 'organization', name: 'rfqOrganization', x: 0, y: 0, w: 8, h: 26, minW: 5, minH: 10 },
  { i: 'blotter', name: 'rfqBlotter', x: 8, y: 0, w: 4, h: 26, minW: 3, minH: 6 },
]
