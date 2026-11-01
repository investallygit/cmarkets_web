import type { ScreenPanel } from '@/features/workspace-layout'

/** Screen 6 mockup: coverage and EODHD on the left, the current upload and the history (12 x 26). */
export const DATA_IMPORT_LAYOUT: readonly ScreenPanel[] = [
  { i: 'coverage', name: 'sessionCoverage', x: 0, y: 0, w: 3, h: 14, minW: 2, minH: 8 },
  { i: 'eodhd', name: 'eodhd', x: 0, y: 14, w: 3, h: 12, minW: 2, minH: 8 },
  { i: 'upload', name: 'upload', x: 3, y: 0, w: 9, h: 17, minW: 6, minH: 12 },
  { i: 'history', name: 'uploadHistory', x: 3, y: 17, w: 9, h: 9, minW: 4, minH: 5 },
]
