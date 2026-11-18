import type { ScreenPanel } from '@/features/workspace-layout'

/** ME: the profile on the left, the security beside it (12 x 26 grid). */
export const ACCOUNT_SETTINGS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'profile', name: 'profile', x: 0, y: 0, w: 6, h: 18, minW: 3, minH: 8 },
  { i: 'security', name: 'security', x: 6, y: 0, w: 6, h: 18, minW: 3, minH: 8 },
]
