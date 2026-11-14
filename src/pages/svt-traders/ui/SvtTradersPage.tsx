import { ScreenWorkspace } from '@/features/workspace-layout'
import { TraderLinksPanel } from '@/widgets/trader-links-panel'
import { SVT_TRADERS_LAYOUT } from '../config/layout'

/**
 * TRD, an SVT's trader links (ROADMAP decision 16; screen 27's panel, spec section 9): the
 * requests its bank received, confirmed with a daily limit or declined, and the linked traders,
 * whose limit is changed or link removed.
 */
export function SvtTradersPage() {
  const panels = { links: <TraderLinksPanel /> }
  return <ScreenWorkspace screenId="TRD" defaultLayout={SVT_TRADERS_LAYOUT} panels={panels} />
}
