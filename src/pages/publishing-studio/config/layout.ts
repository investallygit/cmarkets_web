import type { ScreenPanel } from '@/features/workspace-layout'

/** Screen 7 mockup: publications above earnings, the editor, the settings on the right. */
// prettier-ignore
export const STUDIO_LAYOUT: readonly ScreenPanel[] = [
  { i: 'mine', name: 'myPublications', x: 0, y: 0, w: 3, h: 15, minW: 2, minH: 5 },
  { i: 'earnings', name: 'earnings', x: 0, y: 15, w: 3, h: 11, minW: 2, minH: 5 },
  { i: 'editor', name: 'editor', x: 3, y: 0, w: 6, h: 26, minW: 4, minH: 12 },
  { i: 'settings', name: 'publicationSettings', x: 9, y: 0, w: 3, h: 26, minW: 3, minH: 12 },
]
