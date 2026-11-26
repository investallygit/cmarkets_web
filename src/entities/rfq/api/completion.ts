import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api/adminData'
import type {
  RfqCompletionQuery,
  RfqCompletionReasonInput,
  RfqDisputeInput,
  RfqDisputeStatus,
} from '@/shared/api/contracts'
import { adminApi, rfqApi } from '@/shared/api/endpoints'
import { saveBlob } from '@/shared/lib/download'
import { rfqKeys } from './queries'

/** The completion's keys (ROADMAP step 62): under RFQ's, so that its events refresh them. */
export const completionKeys = {
  all: () => [...rfqKeys.all, 'completion'] as const,
  detail: (orgId: string, query: RfqCompletionQuery) =>
    [...rfqKeys.all, 'completion', orgId, query] as const,
}

/** The Admin's, under its root: an Admin's action refreshes them all. */
export const adminCompletionKeys = {
  participants: () => [...ADMIN_QUERY_ROOT, 'rfq-completion', 'participants'] as const,
  participant: (orgId: string, query: RfqCompletionQuery) =>
    [...ADMIN_QUERY_ROOT, 'rfq-completion', 'participant', orgId, query] as const,
  disputes: (status: RfqDisputeStatus | undefined) =>
    [...ADMIN_QUERY_ROOT, 'rfq-completion', 'disputes', status ?? 'all'] as const,
}

/**
 * GET /rfq/participants/{orgId}/completion: an organisation's ratios (or one of its traders'),
 * the failures by cause, the withdrawal rate; its cases for its own members. Null: nothing asked.
 */
export function useRfqCompletion(orgId: string | null, query: RfqCompletionQuery = {}) {
  return useQuery({
    queryKey: completionKeys.detail(orgId ?? '', query),
    queryFn: ({ signal }) => rfqApi.completion(orgId!, query, signal),
    enabled: orgId !== null,
  })
}

/** POST /rfq/completion/{caseId}/disputes: the ratio's detail read again. */
export function useRaiseRfqDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, input }: { caseId: string; input: RfqDisputeInput }) =>
      rfqApi.raiseDispute(caseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: completionKeys.all() }),
  })
}

/** The Admin's list of participants with cases, their ratios and open disputes. */
export function useRfqParticipants() {
  return useQuery({
    queryKey: adminCompletionKeys.participants(),
    queryFn: ({ signal }) => adminApi.rfqParticipants(signal),
  })
}

/** An organisation's ratios and cases as the Admin reads them. */
export function useAdminRfqCompletion(orgId: string | null, query: RfqCompletionQuery = {}) {
  return useQuery({
    queryKey: adminCompletionKeys.participant(orgId ?? '', query),
    queryFn: ({ signal }) => adminApi.rfqParticipant(orgId!, query, signal),
    enabled: orgId !== null,
  })
}

export function useRfqDisputes(status?: RfqDisputeStatus) {
  return useQuery({
    queryKey: adminCompletionKeys.disputes(status),
    queryFn: ({ signal }) => adminApi.rfqDisputes(status, signal),
  })
}

/** The Admin neutralises a case (its open dispute upheld) or turns a dispute down: in AUDT. */
export function useDecideRfqCase() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (
      decision:
        | { kind: 'neutralize'; caseId: string; input: RfqCompletionReasonInput }
        | { kind: 'reject'; disputeId: string; input: RfqCompletionReasonInput },
    ) =>
      decision.kind === 'neutralize'
        ? adminApi.neutralizeRfqCase(decision.caseId, decision.input)
        : adminApi.rejectRfqDispute(decision.disputeId, decision.input),
    onSuccess: refresh,
  })
}

/** A file of a dispute's evidence, saved under its name. */
export function useRfqDisputeFile() {
  return useMutation({
    mutationFn: async ({ id, index, fileName }: { id: string; index: number; fileName: string }) =>
      saveBlob(await adminApi.rfqDisputeFile(id, index), fileName),
  })
}
