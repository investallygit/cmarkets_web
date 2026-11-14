import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RfqAnswerInput, RfqQuoteType } from '@/shared/api/contracts'
import { rfqApi, type RfqBoardQuery, type RfqScope } from '@/shared/api/endpoints'

/** What GET /rfq/pricing is asked: a security at a settlement date, a value in a quote type. */
export interface RfqPricingQuery {
  securityId: string
  settlementDate: string
  quoteType?: RfqQuoteType
  value?: number
}

export const rfqKeys = {
  all: ['rfq'] as const,
  setup: () => ['rfq', 'setup'] as const,
  pricing: (query: RfqPricingQuery) => ['rfq', 'pricing', query] as const,
  boards: () => ['rfq', 'board'] as const,
  board: (filters: RfqBoardQuery) => ['rfq', 'board', filters] as const,
  mines: () => ['rfq', 'mine'] as const,
  mine: (scope: RfqScope) => ['rfq', 'mine', scope] as const,
  blotters: () => ['rfq', 'blotter'] as const,
  blotter: (scope: RfqScope) => ['rfq', 'blotter', scope] as const,
  request: (id: string) => ['rfq', 'request', id] as const,
}

/** GET /rfq/setup: the BTA and OTA traded, the settlement dates, the minimum, the confirmed SVTs. */
export function useRfqSetup(enabled = true) {
  return useQuery({
    queryKey: rfqKeys.setup(),
    queryFn: ({ signal }) => rfqApi.setup(signal),
    enabled,
  })
}

/**
 * GET /rfq/pricing: the curve's reference and the latest auction; with a value, the other side of
 * the quote, the last answer kept on screen while the next one comes.
 */
export function useRfqPricing(query: RfqPricingQuery | null) {
  return useQuery({
    queryKey: rfqKeys.pricing(query ?? { securityId: '', settlementDate: '' }),
    queryFn: ({ signal }) => rfqApi.pricing(query!, signal),
    enabled: query !== null,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

/** GET /rfq/board: the open requests other than the trader's, its answer to each. */
export function useRfqBoard(filters: RfqBoardQuery = {}, enabled = true) {
  return useQuery({
    queryKey: rfqKeys.board(filters),
    queryFn: ({ signal }) => rfqApi.board(filters, signal),
    enabled,
  })
}

/** GET /rfq/mine: the trader's requests of the day and those open, or its organisation's. */
export function useMyRfqs(scope: RfqScope, enabled = true) {
  return useQuery({
    queryKey: rfqKeys.mine(scope),
    queryFn: ({ signal }) => rfqApi.mine(scope, signal),
    enabled,
  })
}

/** GET /rfq/blotter: the day's counts and latest events. */
export function useRfqBlotter(scope: RfqScope, enabled = true) {
  return useQuery({
    queryKey: rfqKeys.blotter(scope),
    queryFn: ({ signal }) => rfqApi.blotter(scope, signal),
    enabled,
  })
}

/** GET /rfq/{id}: the request as the reader may see it. */
export function useRfqRequest(id: string | null) {
  return useQuery({
    queryKey: rfqKeys.request(id ?? ''),
    queryFn: ({ signal }) => rfqApi.request(id!, signal),
    enabled: id !== null,
  })
}

/** Every RFQ query read again after the user's own change: the hub tells the others. */
function useRefreshRfq() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: rfqKeys.all })
}

/** POST /rfq: on the board at once. */
export function usePublishRfq() {
  const refresh = useRefreshRfq()
  return useMutation({ mutationFn: rfqApi.publish, onSuccess: refresh })
}

/** POST /rfq/{id}/confirm at the version shown: 409 "Selection changed" when it moved. */
export function useConfirmRfq() {
  const refresh = useRefreshRfq()
  return useMutation({
    mutationFn: ({ id, allocationVersion }: { id: string; allocationVersion: number }) =>
      rfqApi.confirm(id, { allocationVersion }),
    onSettled: refresh,
  })
}

/** POST /rfq/{id}/cancel */
export function useCancelRfq() {
  const refresh = useRefreshRfq()
  return useMutation({ mutationFn: rfqApi.cancel, onSettled: refresh })
}

/** POST /rfq/{id}/responses */
export function useSendRfqAnswer() {
  const refresh = useRefreshRfq()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RfqAnswerInput }) => rfqApi.answer(id, input),
    onSuccess: refresh,
  })
}

/** PUT /rfq/{id}/responses/{responseId}: the price kept or bettered. */
export function useImproveRfqAnswer() {
  const refresh = useRefreshRfq()
  return useMutation({
    mutationFn: ({
      id,
      responseId,
      input,
    }: {
      id: string
      responseId: string
      input: RfqAnswerInput
    }) => rfqApi.improve(id, responseId, input),
    onSuccess: refresh,
  })
}

/** DELETE /rfq/{id}/responses/{responseId} */
export function useWithdrawRfqAnswer() {
  const refresh = useRefreshRfq()
  return useMutation({
    mutationFn: ({ id, responseId }: { id: string; responseId: string }) =>
      rfqApi.withdraw(id, responseId),
    onSuccess: refresh,
  })
}
