import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api'
import type {
  AllocationBy,
  PortfolioSummaryDto,
  PortfolioUpdateDto,
  ReportJobDto,
  ReportRequestDto,
  TransactionInputDto,
} from '@/shared/api/contracts'
import { portfoliosApi } from '@/shared/api/endpoints'

/** The period of a performance series; null from: since inception. */
export interface PerformanceQuery {
  from: string | null
  to?: string
  benchmark?: string
}

export const portfolioKeys = {
  all: ['portfolios'] as const,
  list: () => [...portfolioKeys.all, 'list'] as const,
  /** Everything the server derives from one portfolio's transactions and settings. */
  portfolio: (id: string) => [...portfolioKeys.all, 'portfolio', id] as const,
  detail: (id: string) => [...portfolioKeys.portfolio(id), 'detail'] as const,
  positions: (id: string) => [...portfolioKeys.portfolio(id), 'positions'] as const,
  transactions: (id: string) => [...portfolioKeys.portfolio(id), 'transactions'] as const,
  performance: (id: string, query: PerformanceQuery) =>
    [...portfolioKeys.portfolio(id), 'performance', query] as const,
  allocation: (id: string, by: AllocationBy) =>
    [...portfolioKeys.portfolio(id), 'allocation', by] as const,
  risk: (id: string) => [...portfolioKeys.portfolio(id), 'risk'] as const,
  income: (id: string) => [...portfolioKeys.portfolio(id), 'income'] as const,
  report: (jobId: string) => [...portfolioKeys.all, 'report', jobId] as const,
}

/** The server revalues the lines this often; live prices move them in between. */
const POSITIONS_REFRESH_MS = 60_000
/** A report job is asked for its progress this often until it is done. */
const REPORT_POLL_MS = 800

/** GET /portfolios */
export function usePortfolios({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: ({ signal }) => portfoliosApi.list(signal),
    enabled,
  })
}

/** GET /portfolios/{id}: the settings, limits and model allocation. */
export function usePortfolio(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.detail(id ?? ''),
    queryFn: ({ signal }) => portfoliosApi.portfolio(id ?? '', signal),
    enabled: Boolean(id),
  })
}

/** GET /portfolios/{id}/positions: the lines at the last prices. */
export function usePositions(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.positions(id ?? ''),
    queryFn: ({ signal }) => portfoliosApi.positions(id ?? '', signal),
    enabled: Boolean(id),
    refetchInterval: POSITIONS_REFRESH_MS,
  })
}

/** GET /portfolios/{id}/transactions, newest first. */
export function useTransactions(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.transactions(id ?? ''),
    queryFn: ({ signal }) => portfoliosApi.transactions(id ?? '', signal),
    enabled: Boolean(id),
  })
}

/** GET /portfolios/{id}/performance?from=&to=&benchmark= */
export function usePerformance(id: string | undefined, query: PerformanceQuery) {
  return useQuery({
    queryKey: portfolioKeys.performance(id ?? '', query),
    queryFn: ({ signal }) =>
      portfoliosApi.performance(
        id ?? '',
        { from: query.from, to: query.to, benchmark: query.benchmark },
        signal,
      ),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

/** GET /portfolios/{id}/allocation?by= */
export function useAllocation(id: string | undefined, by: AllocationBy) {
  return useQuery({
    queryKey: portfolioKeys.allocation(id ?? '', by),
    queryFn: ({ signal }) => portfoliosApi.allocation(id ?? '', by, signal),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

/** GET /portfolios/{id}/risk */
export function useRisk(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.risk(id ?? ''),
    queryFn: ({ signal }) => portfoliosApi.risk(id ?? '', signal),
    enabled: Boolean(id),
  })
}

/** GET /portfolios/{id}/income */
export function useIncome(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.income(id ?? ''),
    queryFn: ({ signal }) => portfoliosApi.income(id ?? '', signal),
    enabled: Boolean(id),
  })
}

/**
 * After a change, everything derived from the portfolio is stale. A 409 means someone else
 * changed it meanwhile: the latest version is fetched, so the next attempt can succeed.
 */
function useRefresh() {
  const queryClient = useQueryClient()
  return {
    portfolio: (id: string) => {
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.portfolio(id) })
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.list() })
    },
    onConflict: (id: string) => (error: Error) => {
      if (isApiError(error, 409)) {
        void queryClient.invalidateQueries({ queryKey: portfolioKeys.portfolio(id) })
      }
    },
    removed: (id: string) => {
      queryClient.removeQueries({ queryKey: portfolioKeys.portfolio(id) })
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.list() })
    },
  }
}

export function useCreatePortfolio() {
  const refresh = useRefresh()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfoliosApi.create,
    onSuccess: (created) => {
      // In the list at once, so the screen can open it before the list is fetched again.
      queryClient.setQueryData<PortfolioSummaryDto[]>(portfolioKeys.list(), (list) =>
        list ? [...list, created] : list,
      )
      queryClient.setQueryData(portfolioKeys.detail(created.id), created)
      refresh.portfolio(created.id)
    },
  })
}

export function useUpdatePortfolio(id: string) {
  const refresh = useRefresh()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PortfolioUpdateDto) => portfoliosApi.update(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(portfolioKeys.detail(id), updated)
      refresh.portfolio(id)
    },
    onError: refresh.onConflict(id),
  })
}

export function useDeletePortfolio() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: portfoliosApi.remove,
    onSuccess: (_result, id) => refresh.removed(id),
  })
}

export function useRecordTransaction(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: TransactionInputDto) => portfoliosApi.recordTransaction(portfolioId, input),
    onSuccess: () => refresh.portfolio(portfolioId),
  })
}

/** Corrects a transaction; the input carries the version it was read at. */
export function useUpdateTransaction(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, ...input }: TransactionInputDto & { id: string }) =>
      portfoliosApi.updateTransaction(portfolioId, id, input),
    onSuccess: () => refresh.portfolio(portfolioId),
    onError: refresh.onConflict(portfolioId),
  })
}

export function useDeleteTransaction(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) => portfoliosApi.deleteTransaction(portfolioId, id),
    onSuccess: () => refresh.portfolio(portfolioId),
  })
}

/** POST /portfolios/{id}/transactions/import: the CSV or Excel file of the template. */
export function useImportTransactions(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (file: File) => portfoliosApi.importTransactions(portfolioId, file),
    onSuccess: () => refresh.portfolio(portfolioId),
  })
}

/** POST /portfolios/{id}/reports: queues the PDF report, with the company logo if any. */
export function useRequestReport(portfolioId: string) {
  return useMutation({
    mutationFn: ({ request, logo }: { request: ReportRequestDto; logo: File | null }) =>
      portfoliosApi.requestReport(portfolioId, request, logo),
  })
}

/** GET /reports/{jobId}, asked again until the report is done or has failed. */
export function useReportJob(jobId: string) {
  return useQuery({
    queryKey: portfolioKeys.report(jobId),
    queryFn: ({ signal }) => portfoliosApi.reportJob(jobId, signal),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'done' || status === 'failed' ? false : REPORT_POLL_MS
    },
    staleTime: Infinity,
  })
}

/** The PDF of a finished report, fetched with the session, once. */
export function useReportFile(job: ReportJobDto | undefined) {
  return useQuery({
    queryKey: [...portfolioKeys.report(job?.jobId ?? ''), 'file'],
    // GET /reports/{jobId}/file, the job's downloadPath once it is done.
    queryFn: ({ signal }) => portfoliosApi.reportFile(job?.jobId ?? '', signal),
    enabled: Boolean(job?.downloadPath),
    staleTime: Infinity,
  })
}
