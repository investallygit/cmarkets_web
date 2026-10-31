import { ScreenWorkspace } from '@/features/workspace-layout'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { PayoutsPanel } from '@/widgets/payouts-panel'

const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'payouts', x: 0, y: 0, w: 12, h: 26, minW: 6, minH: 8 },
]

/**
 * PAY: the analysts' payouts by month, net of CMarket's commission, marked paid once the transfer
 * is made. The filters are in the URL (/admin/payouts?status=due).
 */
export function PayoutsPage() {
  return (
    <ScreenWorkspace screenId="PAY" defaultLayout={LAYOUT} panels={{ payouts: <PayoutsPanel /> }} />
  )
}
