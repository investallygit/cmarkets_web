import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * CAL, the screen 32 mockup (sixth version) in grid units, 12 columns x 28 rows: the filters on
 * the left, the agenda in the centre, the event picked and the calendar alerts on the right.
 */
export const MARKET_CALENDAR_LAYOUT: readonly ScreenPanel[] = [
  { i: 'filters', name: 'calendarFilters', x: 0, y: 0, w: 3, h: 28, minW: 2, minH: 8 },
  { i: 'agenda', name: 'calendarAgenda', x: 3, y: 0, w: 5, h: 28, minW: 4, minH: 8 },
  { i: 'event', name: 'calendarEvent', x: 8, y: 0, w: 4, h: 14, minW: 3, minH: 6 },
  { i: 'alerts', name: 'calendarAlerts', x: 8, y: 14, w: 4, h: 14, minW: 3, minH: 4 },
]
