import type { WorkspaceItem } from '@/shared/ui/Workspace'

/** Screen 8 mockup: the list on the left, the preview above the analyst on the right. */
// prettier-ignore
export const LIBRARY_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'list', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
  { i: 'preview', x: 7, y: 0, w: 5, h: 17, minW: 3, minH: 8 },
  { i: 'analyst', x: 7, y: 17, w: 5, h: 9, minW: 3, minH: 5 },
]
