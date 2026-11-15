import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AgreementRecipient,
  RfqAgreementFilterInput,
  RfqCancelAgreementInput,
} from '@/shared/api/contracts'
import { rfqApi, type RfqAgreementQuery } from '@/shared/api/endpoints'

/** Under the RFQ's keys (`['rfq']`): what reads the whole RFQ again reads the agreements too. */
export const rfqAgreementKeys = {
  all: ['rfq', 'agreements'] as const,
  lists: () => ['rfq', 'agreements', 'list'] as const,
  list: (query: RfqAgreementQuery) => ['rfq', 'agreements', 'list', query] as const,
  options: () => ['rfq', 'agreements', 'options'] as const,
  detail: (id: string) => ['rfq', 'agreements', 'detail', id] as const,
  filters: () => ['rfq', 'agreement-filters'] as const,
}

/** GET /rfq/agreements: the page asked, the last one kept on screen while the next one comes. */
export function useRfqAgreements(query: RfqAgreementQuery) {
  return useQuery({
    queryKey: rfqAgreementKeys.list(query),
    queryFn: ({ signal }) => rfqApi.agreements(query, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /rfq/agreements/options: the securities, states, SVTs and traders the filters offer. */
export function useRfqAgreementOptions() {
  return useQuery({
    queryKey: rfqAgreementKeys.options(),
    queryFn: ({ signal }) => rfqApi.agreementOptions(signal),
  })
}

/** GET /rfq/agreements/{id}: the agreement picked in the list. */
export function useRfqAgreement(id: string | null) {
  return useQuery({
    queryKey: rfqAgreementKeys.detail(id ?? ''),
    queryFn: ({ signal }) => rfqApi.agreement(id!, signal),
    enabled: id !== null,
  })
}

/** GET /rfq/agreements/export: a Blob, XLSX or CSV, of every agreement the filters keep. */
export function useExportRfqAgreements() {
  return useMutation({
    mutationFn: ({ query, format }: { query: RfqAgreementQuery; format: 'xlsx' | 'csv' }) =>
      rfqApi.exportAgreements(query, format),
  })
}

/**
 * GET /rfq/agreements/{id}/ticket.pdf: the stored ticket, a Blob; the detail read again after, as a
 * first download makes the ticket of an agreement concluded before it had one.
 */
export function useDownloadRfqTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rfqApi.agreementTicket(id),
    onSuccess: (_blob, id) =>
      void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.detail(id) }),
  })
}

/**
 * POST /rfq/agreements/{id}/resend: the ticket again to its recipients or one; the lists (their
 * e-mail status) and the detail (its log) read again, a failure included.
 */
export function useResendRfqTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, recipient }: { id: string; recipient: AgreementRecipient | null }) =>
      rfqApi.resendTicket(id, recipient),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.all }),
  })
}

/** POST /rfq/agreements/{id}/cancel: the list and the detail read again, a 409 included. */
export function useCancelRfqAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RfqCancelAgreementInput }) =>
      rfqApi.cancelAgreement(id, input),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['rfq'] }),
  })
}

/** GET /rfq/agreement-filters: the user's saved filters, by name. */
export function useAgreementFilters() {
  return useQuery({
    queryKey: rfqAgreementKeys.filters(),
    queryFn: ({ signal }) => rfqApi.agreementFilters(signal),
  })
}

/** POST /rfq/agreement-filters: 409 for a name kept already. */
export function useSaveAgreementFilter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RfqAgreementFilterInput) => rfqApi.saveAgreementFilter(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.filters() }),
  })
}

/** DELETE /rfq/agreement-filters/{id} */
export function useDeleteAgreementFilter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rfqApi.deleteAgreementFilter(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.filters() }),
  })
}
