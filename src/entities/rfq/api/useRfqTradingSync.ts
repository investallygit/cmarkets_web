import { useQueryClient } from '@tanstack/react-query'
import { useRfqEvent } from '@/shared/realtime'
import { rfqKeys } from './queries'

/**
 * The trading's events of /hubs/rfq (ROADMAP step 44): each names what changed and the screens read
 * it again, the API deciding what each reader sees (a responder never the others' answers). The
 * connection is entities/svt-link's, opened while the user holds a key of the RFQ; mounted once by
 * the app shell.
 */
export function useRfqTradingSync() {
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
}
