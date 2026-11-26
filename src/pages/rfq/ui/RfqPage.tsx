import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useCurrentUser, useHasPermission } from '@/entities/session'
import type { RfqEligibleQuery, RfqRequestDto } from '@/shared/api/contracts'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { MySvtsPanel } from '@/widgets/my-svts-panel'
import { BlotterPanel } from '@/widgets/rfq-blotter'
import { BoardPanel } from '@/widgets/rfq-board'
import { CompletionDialog } from '@/widgets/rfq-completion'
import { EligibleSecuritiesPanel, type EligibleSource } from '@/widgets/rfq-eligible-securities'
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
 * with the security (`?security=`). A request by criteria (sixth version) shows its eligible
 * securities in the place of "My SVTs": the new request's preview while its criteria are entered,
 * the request's own list once it is shown in "My request" or picked on the board. The blotter's
 * "My completion" opens the ratio's detail (ROADMAP step 62): the trader's own, its CEO's
 * organisation's.
 */
export function RfqPage() {
  const trader = useHasPermission('rfq:trade')
  const user = useCurrentUser()
  const [completionOpen, setCompletionOpen] = useState(false)
  const showCompletion = () => setCompletionOpen(true)
  const [params] = useSearchParams()
  // The request "My request" shows: the one just published, or one picked; the page holds it.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Whose eligible securities take the place of "My SVTs": the last request by criteria in view.
  const [eligible, setEligible] = useState<EligibleSource | null>(null)
  const showCriteria = useCallback(
    (request: InView, leave: boolean) =>
      setEligible((shown) =>
        request.mode === 'criteria'
          ? { kind: 'request', id: request.id, number: request.number }
          : leave && shown?.kind === 'request'
            ? null
            : shown,
      ),
    [],
  )
  // A request shown in "My request" leaves the list of the one before; one picked on the board adds.
  const onShown = useCallback((request: InView) => showCriteria(request, true), [showCriteria])
  const onPick = useCallback((request: InView) => showCriteria(request, false), [showCriteria])
  const onCriteriaChange = useCallback(
    (query: RfqEligibleQuery | null) => setEligible((shown) => previewOf(query, shown)),
    [],
  )

  const panels = trader
    ? {
        newRequest: (
          <NewRequestPanel
            initialSecurityId={params.get('security')}
            onPublished={(request) => {
              setSelectedId(request.id)
              showCriteria(request, false)
            }}
            onCriteriaChange={onCriteriaChange}
          />
        ),
        myRequest: (
          <MyRequestPanel
            scope="mine"
            selectedId={selectedId}
            onSelect={setSelectedId}
            onShown={onShown}
          />
        ),
        board: <BoardPanel onPick={onPick} />,
        mySvts: eligible ? (
          <EligibleSecuritiesPanel source={eligible} onClose={() => setEligible(null)} />
        ) : (
          <MySvtsPanel />
        ),
        blotter: <BlotterPanel scope="mine" onShowCompletion={showCompletion} />,
      }
    : {
        organization: (
          <MyRequestPanel scope="organization" selectedId={selectedId} onSelect={setSelectedId} />
        ),
        blotter: <BlotterPanel scope="organization" onShowCompletion={showCompletion} />,
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
      <CompletionDialog
        organizationId={completionOpen ? (user?.organization?.id ?? null) : null}
        traderId={trader ? user?.id : undefined}
        onClose={() => setCompletionOpen(false)}
      />
    </div>
  )
}

/** A request in view, whose eligible securities show when it is by criteria. */
type InView = Pick<RfqRequestDto, 'id' | 'number' | 'mode'>

/** The new request's preview by criteria in view, or what was in view once it is left. */
function previewOf(
  query: RfqEligibleQuery | null,
  shown: EligibleSource | null,
): EligibleSource | null {
  if (query) return { kind: 'preview', query }
  return shown?.kind === 'preview' ? null : shown
}
