import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * CFG has no mockup: the profile and security on the left, the subscription across the top
 * right, the organisation and the invoices below it (12 x 26 grid).
 */
export const SETTINGS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'profile', name: 'profile', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 8 },
  { i: 'security', name: 'security', x: 0, y: 14, w: 4, h: 12, minW: 3, minH: 8 },
  { i: 'subscription', name: 'subscription', x: 4, y: 0, w: 8, h: 10, minW: 5, minH: 7 },
  { i: 'organization', name: 'organization', x: 4, y: 10, w: 4, h: 16, minW: 3, minH: 8 },
  { i: 'invoices', name: 'invoices', x: 8, y: 10, w: 4, h: 16, minW: 3, minH: 6 },
]

/**
 * CFG of an account without a plan, the SVT's (ROADMAP decision 16): no subscription nor invoices,
 * its bank's members beside the profile.
 */
export const NO_PLAN_SETTINGS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'profile', name: 'profile', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 8 },
  { i: 'security', name: 'security', x: 0, y: 14, w: 4, h: 12, minW: 3, minH: 8 },
  { i: 'organization', name: 'organization', x: 4, y: 0, w: 8, h: 26, minW: 3, minH: 8 },
]
