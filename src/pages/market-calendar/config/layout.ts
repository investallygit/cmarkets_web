import type { WorkspaceItem } from '@/shared/ui/Workspace'

/**
 * CAL has no mockup: the calendar on top, the BEAC auction results of the screen 4 mockup below
 * (12 x 26 grid).
 */
export const MARKET_CALENDAR_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'calendar', x: 0, y: 0, w: 12, h: 16, minW: 6, minH: 8 },
  { i: 'auctions', x: 0, y: 16, w: 12, h: 10, minW: 6, minH: 4 },
]
