import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * Screen 22 (spec section 9) until ROADMAP step 44 brings its request, board and blotter: "My
 * SVTs", the mockup's right column, alone in its place.
 */
export const RFQ_LAYOUT: readonly ScreenPanel[] = [
  { i: 'mySvts', name: 'mySvts', x: 0, y: 0, w: 5, h: 18, minW: 3, minH: 8 },
]
