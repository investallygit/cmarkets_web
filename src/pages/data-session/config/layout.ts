import type { WorkspaceItem } from '@/shared/ui/Workspace'

/** DATA has no mockup: the coverage of screen 6 in full, the session's uploads, the templates. */
export const DATA_SESSION_LAYOUT: readonly WorkspaceItem[] = [
  { i: 'coverage', x: 0, y: 0, w: 4, h: 26, minW: 3, minH: 10 },
  { i: 'uploads', x: 4, y: 0, w: 8, h: 11, minW: 4, minH: 6 },
  { i: 'templates', x: 4, y: 11, w: 8, h: 15, minW: 4, minH: 6 },
]
