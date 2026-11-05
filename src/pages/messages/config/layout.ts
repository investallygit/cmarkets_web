import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * The three panels of the screen 11 mockup, in grid units (12 columns x 26 rows): the
 * conversations, the thread, the participant.
 */
// prettier-ignore
export const MESSAGES_LAYOUT: readonly ScreenPanel[] = [
  { i: 'conversations', name: 'conversations', x: 0, y: 0, w: 3, h: 26, minW: 3, minH: 10 },
  { i: 'thread', name: 'thread', x: 3, y: 0, w: 6, h: 26, minW: 4, minH: 12 },
  { i: 'participant', name: 'participant', x: 9, y: 0, w: 3, h: 26, minW: 2, minH: 10 },
]
