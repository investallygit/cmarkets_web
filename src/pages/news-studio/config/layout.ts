import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 13 mockup: My news above the earnings on the left, the editor in the centre, the
 * publishing settings above the file import on the right.
 */
// prettier-ignore
export const NEWS_STUDIO_LAYOUT: readonly ScreenPanel[] = [
  { i: 'mine', name: 'myNews', x: 0, y: 0, w: 3, h: 18, minW: 2, minH: 5 },
  { i: 'earnings', name: 'newsEarnings', x: 0, y: 18, w: 3, h: 8, minW: 2, minH: 4 },
  { i: 'editor', name: 'editor', x: 3, y: 0, w: 6, h: 26, minW: 4, minH: 12 },
  { i: 'publishing', name: 'publishing', x: 9, y: 0, w: 3, h: 15, minW: 3, minH: 8 },
  { i: 'import', name: 'fileImport', x: 9, y: 15, w: 3, h: 11, minW: 3, minH: 6 },
  // The newspaper's monthly statements (screen 18: it follows them on screen 13), under the studio.
  { i: 'statements', name: 'newsStatements', x: 0, y: 26, w: 12, h: 9, minW: 4, minH: 5 },
]
