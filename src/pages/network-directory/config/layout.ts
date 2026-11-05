import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * The three panels of the screen 10 mockup, in grid units (12 columns x 26 rows): the filters,
 * the results in two columns of cards, the profile chosen.
 */
// prettier-ignore
export const NETWORK_DIRECTORY_LAYOUT: readonly ScreenPanel[] = [
  { i: 'filters', name: 'filters', x: 0, y: 0, w: 2, h: 26, minW: 2, minH: 10 },
  { i: 'results', name: 'professionals', x: 2, y: 0, w: 6, h: 26, minW: 3, minH: 10 },
  { i: 'profile', name: 'profile', x: 8, y: 0, w: 4, h: 26, minW: 3, minH: 12 },
]
