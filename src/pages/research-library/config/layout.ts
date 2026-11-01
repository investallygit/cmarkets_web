import type { ScreenPanel } from '@/features/workspace-layout'

/** Screen 8 mockup: the list on the left, the preview above the analyst on the right. */
// prettier-ignore
export const LIBRARY_LAYOUT: readonly ScreenPanel[] = [
  { i: 'list', name: 'publications', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
  { i: 'preview', name: 'preview', x: 7, y: 0, w: 5, h: 17, minW: 3, minH: 8 },
  { i: 'analyst', name: 'analyst', x: 7, y: 17, w: 5, h: 9, minW: 3, minH: 5 },
]
