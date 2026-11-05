import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * The three panels of the screen 12 mockup, in grid units (12 columns x 26 rows): my profile,
 * visibility and contact, my card preview.
 */
// prettier-ignore
export const NETWORK_PROFILE_LAYOUT: readonly ScreenPanel[] = [
  { i: 'profile', name: 'myProfile', x: 0, y: 0, w: 5, h: 26, minW: 4, minH: 10 },
  { i: 'visibility', name: 'visibility', x: 5, y: 0, w: 4, h: 26, minW: 3, minH: 10 },
  { i: 'preview', name: 'cardPreview', x: 9, y: 0, w: 3, h: 26, minW: 3, minH: 12 },
]
