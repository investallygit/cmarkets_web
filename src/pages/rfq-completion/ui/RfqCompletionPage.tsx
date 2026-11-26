import { useState } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { DisputesPanel, ParticipantPanel, ParticipantsPanel } from '@/widgets/rfq-completion'
import { RfqTabs } from '@/widgets/rfq-tabs'
import { RFQ_COMPLETION_LAYOUT } from '../config/layout'

/**
 * RFQ CPL, the Admin's RFQ completion (screen 22's completion ratio, sixth version; ROADMAP step
 * 62, decision 54): the participants' disputes of their failures, every organisation's ratios, the
 * cases of the one picked; a case neutralised or a dispute turned down, each traced in AUDT. Under
 * the RFQ's tabs beside the agreements and the BEAC's reporting.
 */
export function RfqCompletionPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <RfqTabs />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="RFQCPL"
          defaultLayout={RFQ_COMPLETION_LAYOUT}
          panels={{
            disputes: <DisputesPanel />,
            participants: (
              <ParticipantsPanel selected={organizationId} onSelect={setOrganizationId} />
            ),
            participant: <ParticipantPanel organizationId={organizationId} />,
          }}
        />
      </div>
    </div>
  )
}
