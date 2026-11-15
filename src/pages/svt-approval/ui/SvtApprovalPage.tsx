import { useState } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import {
  AgreementPanel,
  ApprovalsPanel,
  SvtCounters,
  SvtSettingsPanel,
} from '@/widgets/svt-approval-panels'
import { TraderLinksPanel } from '@/widgets/trader-links-panel'
import { SVT_APPROVAL_LAYOUT } from '../config/layout'

/**
 * Screen 27, SVT approval (spec section 9; ROADMAP step 45): the securities back office of a
 * licensed bank approves or rejects the agreements that name it, within the Admin's window, and
 * manages its trader links: the counters, the agreements to approve with their checks and the
 * latest decisions, the trader links (TRD's panel), the approval settings, and the agreement picked
 * on the right, which the page holds (the first to approve until one is picked).
 */
export function SvtApprovalPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const panels = {
    approvals: <ApprovalsPanel selectedId={selectedId} onSelect={setSelectedId} />,
    links: <TraderLinksPanel code="TRD" />,
    settings: <SvtSettingsPanel />,
    agreement: <AgreementPanel agreementId={selectedId} />,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <SvtCounters />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="SVT" defaultLayout={SVT_APPROVAL_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
