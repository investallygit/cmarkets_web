import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, isApiError, useRefreshAdminData } from '@/shared/api'
import type {
  AnomalyDecisionWriteDto,
  DisputeResolutionWriteDto,
  NewsPaymentSettingsDto,
  NewsPaymentSettingsWriteDto,
  NewsStatementDto,
  SecondAdminReason,
  SourcePaymentSettingsWriteDto,
  StatementStatus,
  StatementStatusWriteDto,
} from '@/shared/api/contracts'
import { adminApi, providerApi, type StatementItemsSort } from '@/shared/api/endpoints'

/** Under the Admin's root: an action of MPAY refreshes every list the back-office shows. */
export const statementKeys = {
  all: [...ADMIN_QUERY_ROOT, 'mediaPayments'] as const,
  list: (month: string, status: StatementStatus | null) =>
    [...statementKeys.all, 'list', month, status] as const,
  summary: (month: string) => [...statementKeys.all, 'summary', month] as const,
  statement: (id: string) => [...statementKeys.all, 'statement', id] as const,
  items: (id: string, sort: StatementItemsSort) =>
    [...statementKeys.all, 'items', id, sort] as const,
  history: (id: string) => [...statementKeys.all, 'history', id] as const,
  anomalies: (month: string, sourceId: string) =>
    [...statementKeys.all, 'anomalies', month, sourceId] as const,
  anomalyClicks: (id: string) => [...statementKeys.all, 'anomalyClicks', id] as const,
  terms: (sourceId: string) => [...statementKeys.all, 'terms', sourceId] as const,
  termsHistory: (sourceId: string) => [...statementKeys.all, 'termsHistory', sourceId] as const,
  settings: () => [...statementKeys.all, 'settings'] as const,
}

/** The newspaper's own statements, in its studio. */
export const providerStatementKeys = { all: ['provider', 'statements'] as const }

/** GET /admin/news-statements?month=: one row per newspaper, the largest amount due first. */
export function useStatements(month: string, status: StatementStatus | null = null) {
  return useQuery({
    queryKey: statementKeys.list(month, status),
    queryFn: ({ signal }) => adminApi.statements(month, status, signal),
  })
}

/** GET /admin/news-statements/summary?month=: MPAY's header. */
export function useStatementsSummary(month: string) {
  return useQuery({
    queryKey: statementKeys.summary(month),
    queryFn: ({ signal }) => adminApi.statementsSummary(month, signal),
  })
}

export function useStatement(id: string | null) {
  return useQuery({
    queryKey: statementKeys.statement(id ?? ''),
    queryFn: ({ signal }) => adminApi.statement(id ?? '', signal),
    enabled: id !== null,
  })
}

export function useStatementItems(id: string | null, sort: StatementItemsSort = 'clicks') {
  return useQuery({
    queryKey: statementKeys.items(id ?? '', sort),
    queryFn: ({ signal }) => adminApi.statementItems(id ?? '', sort, signal),
    enabled: id !== null,
  })
}

export function useStatementHistory(id: string | null) {
  return useQuery({
    queryKey: statementKeys.history(id ?? ''),
    queryFn: ({ signal }) => adminApi.statementHistory(id ?? '', signal),
    enabled: id !== null,
  })
}

/** GET /admin/news-clicks/anomalies?month=&sourceId=: a newspaper's anomalies of the month. */
export function useClickAnomalies(month: string, sourceId: string | null) {
  return useQuery({
    queryKey: statementKeys.anomalies(month, sourceId ?? ''),
    queryFn: ({ signal }) => adminApi.clickAnomalies(month, sourceId ?? '', signal),
    enabled: sourceId !== null,
  })
}

/** "View click details": the clicks an anomaly concerns. */
export function useAnomalyClicks(id: string | null) {
  return useQuery({
    queryKey: statementKeys.anomalyClicks(id ?? ''),
    queryFn: ({ signal }) => adminApi.anomalyClicks(id ?? '', signal),
    enabled: id !== null,
  })
}

/** A partner newspaper's rate and cap in force this month, and the versions to come. */
export function usePaymentTerms(sourceId: string | null) {
  return useQuery({
    queryKey: statementKeys.terms(sourceId ?? ''),
    queryFn: ({ signal }) => adminApi.paymentTerms(sourceId ?? '', signal),
    enabled: sourceId !== null,
  })
}

export function usePaymentTermsHistory(sourceId: string | null) {
  return useQuery({
    queryKey: statementKeys.termsHistory(sourceId ?? ''),
    queryFn: ({ signal }) => adminApi.paymentTermsHistory(sourceId ?? '', signal),
    enabled: sourceId !== null,
  })
}

/** GET /admin/news-payment-settings: the global settings, the defaults until saved. */
export function usePaymentSettings() {
  return useQuery({
    queryKey: statementKeys.settings(),
    queryFn: ({ signal }) => adminApi.paymentSettings(signal),
  })
}

/** The statement as the server answered it, then every list asked again. */
function useKeepStatement() {
  const queryClient = useQueryClient()
  const refresh = useRefreshAdminData()
  return (statement: NewsStatementDto) => {
    queryClient.setQueryData(statementKeys.statement(statement.id), statement)
    refresh()
  }
}

/** A change a second Admin must confirm: the 409 of PUT status, with its request. */
export interface SecondAdminAnswer {
  requestId: string
  why: SecondAdminReason
}

/** The 409 statementSecondAdmin of a status change, or null for any other error. */
export function secondAdminOf(error: unknown): SecondAdminAnswer | null {
  if (!isApiError(error, 409) || error.problem.code !== 'statementSecondAdmin') return null
  return { requestId: String(error.problem.requestId), why: error.problem.why as SecondAdminReason }
}

/**
 * PUT /admin/news-statements/{id}/status: a status and its reason. A change kept for a second
 * Admin fails with the 409 `secondAdminOf` reads; the lists are refreshed anyway, so that the
 * statement shows its request waiting.
 */
export function useChangeStatementStatus() {
  const keep = useKeepStatement()
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, change }: { id: string; change: StatementStatusWriteDto }) =>
      adminApi.changeStatementStatus(id, change),
    onSuccess: keep,
    onError: (error) => {
      if (secondAdminOf(error)) refresh()
    },
  })
}

/** Another Admin confirms the change waiting. */
export function useConfirmStatementRequest() {
  const keep = useKeepStatement()
  return useMutation({
    mutationFn: ({ id, requestId }: { id: string; requestId: string }) =>
      adminApi.confirmStatementRequest(id, requestId),
    onSuccess: keep,
  })
}

export function useCancelStatementRequest() {
  const keep = useKeepStatement()
  return useMutation({
    mutationFn: ({ id, requestId }: { id: string; requestId: string }) =>
      adminApi.cancelStatementRequest(id, requestId),
    onSuccess: keep,
  })
}

export function useReleaseStatement() {
  const keep = useKeepStatement()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) =>
      adminApi.releaseStatement(id, reason),
    onSuccess: keep,
  })
}

export function useRecalculateStatement() {
  const keep = useKeepStatement()
  return useMutation({ mutationFn: adminApi.recalculateStatement, onSuccess: keep })
}

/** The amount maintained, or the statement corrected. */
export function useResolveStatementDispute() {
  const keep = useKeepStatement()
  return useMutation({
    mutationFn: ({
      id,
      disputeId,
      resolution,
    }: {
      id: string
      disputeId: string
      resolution: DisputeResolutionWriteDto
    }) => adminApi.resolveStatementDispute(id, disputeId, resolution),
    onSuccess: keep,
  })
}

/** The anomaly's clicks invalidated or kept; the statement is computed again. */
export function useDecideAnomaly() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: AnomalyDecisionWriteDto }) =>
      adminApi.decideAnomaly(id, decision),
    onSuccess: refresh,
  })
}

/** A new version of a newspaper's payment settings from a month on. */
export function useSavePaymentTerms() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ sourceId, terms }: { sourceId: string; terms: SourcePaymentSettingsWriteDto }) =>
      adminApi.savePaymentTerms(sourceId, terms),
    onSuccess: refresh,
  })
}

export function useSavePaymentSettings() {
  const queryClient = useQueryClient()
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (settings: NewsPaymentSettingsWriteDto) => adminApi.savePaymentSettings(settings),
    onSuccess: (settings: NewsPaymentSettingsDto) => {
      queryClient.setQueryData(statementKeys.settings(), settings)
      refresh()
    },
  })
}

/** GET /provider/statements: the newspaper's statements in its studio. */
export function useProviderStatements() {
  return useQuery({
    queryKey: providerStatementKeys.all,
    queryFn: ({ signal }) => providerApi.statements(signal),
  })
}

/** An approved statement disputed, within the window. */
export function useDisputeStatement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      providerApi.disputeStatement(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: providerStatementKeys.all }),
  })
}
