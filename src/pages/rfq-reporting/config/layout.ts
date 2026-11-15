import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 24 mockup (spec section 9) in grid units, 12 columns x 26 rows, under the tabs and the
 * header:
 *
 *   daily reports | PDF summary preview | send of the day
 */
export const RFQ_REPORT_LAYOUT: readonly ScreenPanel[] = [
  { i: 'reports', name: 'rfqReports', x: 0, y: 0, w: 3, h: 26, minW: 3, minH: 8 },
  { i: 'preview', name: 'rfqReportPreview', x: 3, y: 0, w: 6, h: 26, minW: 4, minH: 10 },
  { i: 'send', name: 'rfqReportSend', x: 9, y: 0, w: 3, h: 26, minW: 3, minH: 10 },
]
