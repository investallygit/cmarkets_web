import type { WorkspaceItem } from '@/shared/ui/Workspace'

/** Screen 7 mockup: publications above earnings, the editor, the settings on the right. */
// prettier-ignore
export const STUDIO_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'mine', x: 0, y: 0, w: 3, h: 15, minW: 2, minH: 5 },
  { i: 'earnings', x: 0, y: 15, w: 3, h: 11, minW: 2, minH: 5 },
  { i: 'editor', x: 3, y: 0, w: 6, h: 26, minW: 4, minH: 12 },
  { i: 'settings', x: 9, y: 0, w: 3, h: 26, minW: 3, minH: 12 },
]
