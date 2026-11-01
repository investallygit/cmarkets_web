import type { ScreenPanel } from '@/features/workspace-layout'

/** ALRT has no mockup: the alerts on the left, what went off on the right (12 x 26 grid). */
export const ALERTS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'alerts', name: 'alerts', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 6 },
  { i: 'history', name: 'alertHistory', x: 7, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
]
