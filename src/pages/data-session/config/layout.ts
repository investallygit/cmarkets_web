import type { ScreenPanel } from '@/features/workspace-layout'

/** DATA has no mockup: the coverage of screen 6 in full, the session's uploads, the templates. */
export const DATA_SESSION_LAYOUT: readonly ScreenPanel[] = [
  { i: 'coverage', name: 'sessionCoverage', x: 0, y: 0, w: 4, h: 26, minW: 3, minH: 10 },
  { i: 'uploads', name: 'sessionUploads', x: 4, y: 0, w: 8, h: 11, minW: 4, minH: 6 },
  { i: 'templates', name: 'importTemplates', x: 4, y: 11, w: 8, h: 15, minW: 4, minH: 6 },
]
