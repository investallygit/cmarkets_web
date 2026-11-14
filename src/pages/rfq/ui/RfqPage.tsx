import { ScreenWorkspace } from '@/features/workspace-layout'
import { MySvtsPanel } from '@/widgets/my-svts-panel'
import { RFQ_LAYOUT } from '../config/layout'

/**
 * Screen 22, RFQ (spec section 9): a Trader's or a Manager's requests for quotes on the BTA and
 * OTA of the BEAC's auctions. ROADMAP step 43 builds its "My SVTs" panel, which the requests need
 * first: only an SVT that confirmed the link is chosen for a trade.
 */
export function RfqPage() {
  const panels = { mySvts: <MySvtsPanel /> }
  return <ScreenWorkspace screenId="RFQ" defaultLayout={RFQ_LAYOUT} panels={panels} />
}
