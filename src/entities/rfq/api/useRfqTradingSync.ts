import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useRfqEvent } from '@/shared/realtime'
import { toast } from '@/shared/ui/toast'
import { rfqKeys } from './queries'
import { svtApprovalKeys } from './svtApprovals'

/**
 * The trading's events of /hubs/rfq (ROADMAP step 44) and the SVTs' approvals (step 45): each names
 * what changed and the screens read it again, the API deciding what each reader sees (a responder
 * never the others' answers). The connection is entities/svt-link's, opened while the user holds a
 * key of the RFQ; mounted once by the app shell.
 */
export function useRfqTradingSync() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const refresh = (...keys: (readonly unknown[])[]) => {
    for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey })
  }

  useRfqEvent('RfqPublished', () => refresh(rfqKeys.boards(), rfqKeys.mines()))
  useRfqEvent('RfqClosed', ({ rfqId }) =>
    refresh(rfqKeys.boards(), rfqKeys.mines(), rfqKeys.blotters(), rfqKeys.request(rfqId)),
  )
  useRfqEvent('ResponseReceived', ({ rfqId }) => refresh(rfqKeys.request(rfqId), rfqKeys.mines()))
  useRfqEvent('ResponseUpdated', ({ rfqId }) =>
    refresh(rfqKeys.request(rfqId), rfqKeys.mines(), rfqKeys.boards()),
  )
  useRfqEvent('AllocationChanged', ({ rfqId }) => refresh(rfqKeys.request(rfqId)))
  useRfqEvent('RfqConfirmed', ({ rfqId }) =>
    refresh(rfqKeys.request(rfqId), rfqKeys.boards(), rfqKeys.mines(), rfqKeys.blotters()),
  )
  useRfqEvent('AgreementCreated', ({ rfqId }) =>
    refresh(rfqKeys.request(rfqId), rfqKeys.blotters()),
  )
  // A link confirmed or removed changes the SVTs a trader may choose, and whether it answers.
  useRfqEvent('SvtLinkChanged', () => refresh(rfqKeys.setup(), rfqKeys.boards()))

  // The SVTs' approvals (screen 27): a bank's accounts told of an agreement to approve, or of its
  // deadline 15 minutes away; both sides read a decision and the agreement's end.
  useRfqEvent('ApprovalRequested', ({ reminder }) => {
    refresh(svtApprovalKeys.summary(), svtApprovalKeys.lists())
    toast.info(t(reminder ? 'svt.realtime.reminder' : 'svt.realtime.requested'))
  })
  useRfqEvent('ApprovalDecided', ({ agreementId }) =>
    refresh(
      svtApprovalKeys.summary(),
      svtApprovalKeys.lists(),
      svtApprovalKeys.detail(agreementId),
    ),
  )
  useRfqEvent('AgreementConcluded', ({ agreementId, rfqId }) =>
    refresh(
      rfqKeys.request(rfqId),
      rfqKeys.mines(),
      rfqKeys.blotters(),
      svtApprovalKeys.detail(agreementId),
    ),
  )
  useRfqEvent('AgreementRejected', ({ agreementId, rfqId }) =>
    refresh(
      rfqKeys.request(rfqId),
      rfqKeys.mines(),
      rfqKeys.blotters(),
      svtApprovalKeys.summary(),
      svtApprovalKeys.lists(),
      svtApprovalKeys.detail(agreementId),
    ),
  )
  // A completion case written or neutralised (sixth version, ROADMAP step 62): the ratios beside
  // the requests, the answers, the blotter, NET and the SVT's traders are read again.
  useRfqEvent('RfqCompletionChanged', () => refresh(rfqKeys.all))
  // The counters count the bank's links.
  useRfqEvent('LinkRequested', () => refresh(svtApprovalKeys.summary()))
  useRfqEvent('LinkChanged', () => refresh(svtApprovalKeys.summary()))
}
