import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * The Admin's RFQ completion (sixth version, ROADMAP step 62; no mockup) in grid units, 12 columns
 * x 26 rows, under the tabs:
 *
 *   disputes | participants
 *            | the participant's cases
 */
export const RFQ_COMPLETION_LAYOUT: readonly ScreenPanel[] = [
  { i: 'disputes', name: 'rfqDisputes', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 8 },
  { i: 'participants', name: 'rfqParticipants', x: 5, y: 0, w: 7, h: 11, minW: 4, minH: 6 },
  { i: 'participant', name: 'rfqParticipant', x: 5, y: 11, w: 7, h: 15, minW: 4, minH: 8 },
]
