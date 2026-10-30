import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, isApiError } from '@/shared/api'
import type {
  AllocationBy,
  AllocationDto,
  IncomeDto,
  PerformanceDto,
  PortfolioCreateDto,
  PortfolioDto,
  PortfolioSummaryDto,
  PortfolioUpdateDto,
  PositionsDto,
  ReportJobDto,
  ReportRequestDto,
  RiskDto,
  TransactionDto,
  TransactionImportResultDto,
  TransactionInputDto,
} from '@/shared/api/contracts'

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

const portfolioPath = (id: string, suffix = '') => `/portfolios/${encodeURIComponent(id)}${suffix}`

/** The server revalues the lines this often; live prices move them in between. */
const POSITIONS_REFRESH_MS = 60_000
/** A report job is asked for its progress this often until it is done. */
const REPORT_POLL_MS = 800

/** GET /portfolios */
export function usePortfolios({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: ({ signal }) => apiClient.get<PortfolioSummaryDto[]>('/portfolios', { signal }),
    enabled,
  })
}

/** GET /portfolios/{id}: the settings, limits and model allocation. */
export function usePortfolio(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.detail(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<PortfolioDto>(portfolioPath(id ?? ''), { signal }),
    enabled: Boolean(id),
  })
}

/** GET /portfolios/{id}/positions: the lines at the last prices. */
export function usePositions(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.positions(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<PositionsDto>(portfolioPath(id ?? '', '/positions'), { signal }),
    enabled: Boolean(id),
    refetchInterval: POSITIONS_REFRESH_MS,
  })
}

/** GET /portfolios/{id}/transactions, newest first. */
export function useTransactions(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.transactions(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<TransactionDto[]>(portfolioPath(id ?? '', '/transactions'), { signal }),
    enabled: Boolean(id),
  })
}

/** GET /portfolios/{id}/performance?from=&to=&benchmark= */
export function usePerformance(id: string | undefined, query: PerformanceQuery) {
  return useQuery({
    queryKey: portfolioKeys.performance(id ?? '', query),
    queryFn: ({ signal }) =>
      apiClient.get<PerformanceDto>(portfolioPath(id ?? '', '/performance'), {
        query: { from: query.from, to: query.to, benchmark: query.benchmark },
        signal,
      }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

/** GET /portfolios/{id}/allocation?by= */
export function useAllocation(id: string | undefined, by: AllocationBy) {
  return useQuery({
    queryKey: portfolioKeys.allocation(id ?? '', by),
    queryFn: ({ signal }) =>
      apiClient.get<AllocationDto>(portfolioPath(id ?? '', '/allocation'), {
        query: { by },
        signal,
      }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

/** GET /portfolios/{id}/risk */
export function useRisk(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.risk(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<RiskDto>(portfolioPath(id ?? '', '/risk'), { signal }),
    enabled: Boolean(id),
  })
}

/** GET /portfolios/{id}/income */
export function useIncome(id: string | undefined) {
  return useQuery({
    queryKey: portfolioKeys.income(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<IncomeDto>(portfolioPath(id ?? '', '/income'), { signal }),
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
    mutationFn: (input: PortfolioCreateDto) => apiClient.post<PortfolioDto>('/portfolios', input),
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
    mutationFn: (input: PortfolioUpdateDto) =>
      apiClient.put<PortfolioDto>(portfolioPath(id), input),
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
    mutationFn: (id: string) => apiClient.delete<void>(portfolioPath(id)),
    onSuccess: (_result, id) => refresh.removed(id),
  })
}

export function useRecordTransaction(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: TransactionInputDto) =>
      apiClient.post<TransactionDto>(portfolioPath(portfolioId, '/transactions'), input),
    onSuccess: () => refresh.portfolio(portfolioId),
  })
}

/** Corrects a transaction; the input carries the version it was read at. */
export function useUpdateTransaction(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, ...input }: TransactionInputDto & { id: string }) =>
      apiClient.put<TransactionDto>(
        portfolioPath(portfolioId, `/transactions/${encodeURIComponent(id)}`),
        input,
      ),
    onSuccess: () => refresh.portfolio(portfolioId),
    onError: refresh.onConflict(portfolioId),
  })
}

export function useDeleteTransaction(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(portfolioPath(portfolioId, `/transactions/${encodeURIComponent(id)}`)),
    onSuccess: () => refresh.portfolio(portfolioId),
  })
}

/** POST /portfolios/{id}/transactions/import: the CSV or Excel file of the template. */
export function useImportTransactions(portfolioId: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return apiClient.postForm<TransactionImportResultDto>(
        portfolioPath(portfolioId, '/transactions/import'),
        form,
      )
    },
    onSuccess: () => refresh.portfolio(portfolioId),
  })
}

/** POST /portfolios/{id}/reports: queues the PDF report, with the company logo if any. */
export function useRequestReport(portfolioId: string) {
  return useMutation({
    mutationFn: ({ request, logo }: { request: ReportRequestDto; logo: File | null }) => {
      const form = new FormData()
      form.append('options', JSON.stringify(request))
      if (logo) form.append('logo', logo)
      return apiClient.postForm<ReportJobDto>(portfolioPath(portfolioId, '/reports'), form)
    },
  })
}

/** GET /reports/{jobId}, asked again until the report is done or has failed. */
export function useReportJob(jobId: string) {
  return useQuery({
    queryKey: portfolioKeys.report(jobId),
    queryFn: ({ signal }) =>
      apiClient.get<ReportJobDto>(`/reports/${encodeURIComponent(jobId)}`, { signal }),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'done' || status === 'failed' ? false : REPORT_POLL_MS
    },
    staleTime: Infinity,
  })
}

/** The PDF of a finished report, fetched with the session, once. */
export function useReportFile(job: ReportJobDto | undefined) {
  const path = job?.downloadPath
  return useQuery({
    queryKey: [...portfolioKeys.report(job?.jobId ?? ''), 'file'],
    queryFn: ({ signal }) => apiClient.getBlob(path ?? '', { signal }),
    enabled: Boolean(path),
    staleTime: Infinity,
  })
}
