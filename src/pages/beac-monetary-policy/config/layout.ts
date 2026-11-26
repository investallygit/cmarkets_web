import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * BEAC, the screen 34 mockup (sixth version) in grid units, 12 columns x 26 rows, under the
 * indicators:
 *
 *   rate corridor             | MPC decisions
 *   injections | interbank    | aggregates
 */
export const BEAC_LAYOUT: readonly ScreenPanel[] = [
  { i: 'corridor', name: 'beacCorridor', x: 0, y: 0, w: 7, h: 14, minW: 4, minH: 6 },
  { i: 'decisions', name: 'beacDecisions', x: 7, y: 0, w: 5, h: 14, minW: 3, minH: 6 },
  { i: 'operations', name: 'beacOperations', x: 0, y: 14, w: 5, h: 12, minW: 3, minH: 6 },
  { i: 'interbank', name: 'beacInterbank', x: 5, y: 14, w: 3, h: 12, minW: 2, minH: 6 },
  { i: 'aggregates', name: 'beacAggregates', x: 8, y: 14, w: 4, h: 12, minW: 3, minH: 6 },
]
