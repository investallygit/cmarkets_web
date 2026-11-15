import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RejectAgreementInput, SvtApprovalDetailDto } from '@/shared/api/contracts'
import { rfqApi, type SvtApprovalsQuery } from '@/shared/api/endpoints'

/** The SVT's approvals (screen 27, ROADMAP step 45): its counters, lists, an agreement, its settings. */
export const svtApprovalKeys = {
  all: ['svt-approvals'] as const,
  summary: () => ['svt-approvals', 'summary'] as const,
  lists: () => ['svt-approvals', 'list'] as const,
  list: (query: SvtApprovalsQuery) => ['svt-approvals', 'list', query] as const,
  details: () => ['svt-approvals', 'detail'] as const,
  detail: (agreementId: string) => ['svt-approvals', 'detail', agreementId] as const,
  settings: () => ['svt-approvals', 'settings'] as const,
}

/** GET /svt/summary: to approve, decided today, the amount approved, the links, the window. */
export function useSvtSummary(enabled = true) {
  return useQuery({
    queryKey: svtApprovalKeys.summary(),
    queryFn: ({ signal }) => rfqApi.svtSummary(signal),
    enabled,
  })
}

/** GET /svt/approvals: the bank's approvals waiting, by time left; or decided, newest first. */
export function useSvtApprovals(query: SvtApprovalsQuery, enabled = true) {
  return useQuery({
    queryKey: svtApprovalKeys.list(query),
    queryFn: ({ signal }) => rfqApi.svtApprovals(query, signal),
    enabled,
  })
}

/** GET /svt/approvals/{agreementId}: the agreement, both approvals, what the reader may do. */
export function useSvtApproval(agreementId: string | null) {
  return useQuery({
    queryKey: svtApprovalKeys.detail(agreementId ?? ''),
    queryFn: ({ signal }) => rfqApi.svtApproval(agreementId ?? '', signal),
    enabled: agreementId !== null,
  })
}

/** The detail a decision answers, kept; the counters and lists read again. */
function useDecided() {
  const queryClient = useQueryClient()
  return (detail: SvtApprovalDetailDto) => {
    queryClient.setQueryData(svtApprovalKeys.detail(detail.agreement.id), detail)
    void queryClient.invalidateQueries({ queryKey: svtApprovalKeys.summary() })
    void queryClient.invalidateQueries({ queryKey: svtApprovalKeys.lists() })
  }
}

/** POST /svt/approvals/{agreementId}/approve: the bank's leg, or the first of four eyes. */
export function useApproveAgreement() {
  const decided = useDecided()
  return useMutation({ mutationFn: rfqApi.approveAgreement, onSuccess: decided })
}

/** POST /svt/approvals/{agreementId}/reject, with the reason both traders are told. */
export function useRejectAgreement() {
  const decided = useDecided()
  return useMutation({
    mutationFn: ({ agreementId, input }: { agreementId: string; input: RejectAgreementInput }) =>
      rfqApi.rejectAgreement(agreementId, input),
    onSuccess: decided,
  })
}

/** GET /svt/settings: the bank's approval settings, with the Admin's window. */
export function useSvtSettings(enabled = true) {
  return useQuery({
    queryKey: svtApprovalKeys.settings(),
    queryFn: ({ signal }) => rfqApi.svtSettings(signal),
    enabled,
  })
}

/** PUT /svt/settings */
export function useSaveSvtSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rfqApi.saveSvtSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(svtApprovalKeys.settings(), settings)
      // Four eyes depends on the threshold: the lists read it again.
      void queryClient.invalidateQueries({ queryKey: svtApprovalKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: svtApprovalKeys.details() })
    },
  })
}
