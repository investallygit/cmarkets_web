import type { ScreenPanel } from '@/features/workspace-layout'

/** TRD has no mockup: screen 27's "Trader links" panel, on a screen of its own (ROADMAP decision 16). */
export const SVT_TRADERS_LAYOUT: readonly ScreenPanel[] = [
  { i: 'links', name: 'traderLinks', x: 0, y: 0, w: 7, h: 22, minW: 4, minH: 10 },
]
