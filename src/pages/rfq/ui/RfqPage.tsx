import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useHasPermission } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { MySvtsPanel } from '@/widgets/my-svts-panel'
import { BlotterPanel } from '@/widgets/rfq-blotter'
import { BoardPanel } from '@/widgets/rfq-board'
import { MyRequestPanel } from '@/widgets/rfq-my-request'
import { NewRequestPanel } from '@/widgets/rfq-new-request'
import { RfqTabs } from '@/widgets/rfq-tabs'
import { RFQ_LAYOUT, RFQ_READER_LAYOUT } from '../config/layout'

/**
 * Screen 22, RFQ (spec section 9): a Trader's or a Manager's requests for quotes on the BTA and
 * OTA of the BEAC's auctions: a new request, the request picked with its ranked answers and the
 * automatic selection, the board of the other organisations' requests with the answer form, the
 * SVTs it trades through (ROADMAP step 43) and the day's blotter (step 44). Its CEO reads the
 * organisation's requests and blotter. "Request a price (RFQ)" on BS or a bond's profile opens it
 * with the security (`?security=`).
 */
export function RfqPage() {
  const trader = useHasPermission('rfq:trade')
  const [params] = useSearchParams()
  // The request "My request" shows: the one just published, or one picked; the page holds it.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const panels = trader
    ? {
        newRequest: (
          <NewRequestPanel
            initialSecurityId={params.get('security')}
            onPublished={(request) => setSelectedId(request.id)}
          />
        ),
        myRequest: <MyRequestPanel scope="mine" selectedId={selectedId} onSelect={setSelectedId} />,
        board: <BoardPanel />,
        mySvts: <MySvtsPanel />,
        blotter: <BlotterPanel scope="mine" />,
      }
    : {
        organization: (
          <MyRequestPanel scope="organization" selectedId={selectedId} onSelect={setSelectedId} />
        ),
        blotter: <BlotterPanel scope="organization" />,
      }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <RfqTabs />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="RFQ"
          defaultLayout={trader ? RFQ_LAYOUT : RFQ_READER_LAYOUT}
          panels={panels}
        />
      </div>
    </div>
  )
}
