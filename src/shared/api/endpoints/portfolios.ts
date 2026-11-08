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
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

export interface PerformanceQuery {
  /** From the start of the portfolio when null. */
  from?: string | null
  to?: string
  /** An index code; the portfolio's own benchmark when absent. */
  benchmark?: string
}

/**
 * CMarket.Api/Controllers/Portfolios: the portfolios, their valuation and transactions, and the
 * PDF reports built by a job.
 */
export const portfoliosRoutes = {
  list: route('GET', '/portfolios', answer<PortfolioSummaryDto[]>()),
  create: route('POST', '/portfolios', answer<PortfolioDto>()),
  portfolio: route('GET', '/portfolios/{id}', answer<PortfolioDto>()),
  update: route('PUT', '/portfolios/{id}', answer<PortfolioDto>()),
  remove: route('DELETE', '/portfolios/{id}'),
  positions: route('GET', '/portfolios/{id}/positions', answer<PositionsDto>()),
  performance: route('GET', '/portfolios/{id}/performance', answer<PerformanceDto>()),
  allocation: route('GET', '/portfolios/{id}/allocation', answer<AllocationDto>()),
  risk: route('GET', '/portfolios/{id}/risk', answer<RiskDto>()),
  income: route('GET', '/portfolios/{id}/income', answer<IncomeDto>()),
  transactions: route('GET', '/portfolios/{id}/transactions', answer<TransactionDto[]>()),
  recordTransaction: route('POST', '/portfolios/{id}/transactions', answer<TransactionDto>()),
  updateTransaction: route(
    'PUT',
    '/portfolios/{id}/transactions/{transactionId}',
    answer<TransactionDto>(),
  ),
  deleteTransaction: route('DELETE', '/portfolios/{id}/transactions/{transactionId}'),
  importTransactions: route(
    'POST',
    '/portfolios/{id}/transactions/import',
    answer<TransactionImportResultDto>(),
  ),
  requestReport: route('POST', '/portfolios/{id}/reports', answer<ReportJobDto>()),
  reportJob: route('GET', '/reports/{jobId}', answer<ReportJobDto>()),
  reportFile: route('GET', '/reports/{jobId}/file', answer<Blob>()),
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const portfoliosApi = {
  /** The user's portfolios, then those the colleagues share. */
  list: (signal?: AbortSignal) => send(portfoliosRoutes.list, { signal }),
  create: (input: PortfolioCreateDto) => send(portfoliosRoutes.create, { body: input }),
  /** The settings, limits and model allocation. */
  portfolio: (id: string, signal?: AbortSignal) => send(portfoliosRoutes.portfolio, of(id, signal)),
  update: (id: string, input: PortfolioUpdateDto) =>
    send(portfoliosRoutes.update, { params: { id }, body: input }),
  remove: (id: string) => send(portfoliosRoutes.remove, { params: { id } }),
  /** The lines at the last prices. */
  positions: (id: string, signal?: AbortSignal) => send(portfoliosRoutes.positions, of(id, signal)),
  performance: (id: string, query: PerformanceQuery, signal?: AbortSignal) =>
    send(portfoliosRoutes.performance, { ...of(id, signal), query: { ...query } }),
  allocation: (id: string, by: AllocationBy, signal?: AbortSignal) =>
    send(portfoliosRoutes.allocation, { ...of(id, signal), query: { by } }),
  risk: (id: string, signal?: AbortSignal) => send(portfoliosRoutes.risk, of(id, signal)),
  income: (id: string, signal?: AbortSignal) => send(portfoliosRoutes.income, of(id, signal)),
  /** Newest first. */
  transactions: (id: string, signal?: AbortSignal) =>
    send(portfoliosRoutes.transactions, of(id, signal)),
  recordTransaction: (id: string, input: TransactionInputDto) =>
    send(portfoliosRoutes.recordTransaction, { params: { id }, body: input }),
  /** The input carries the version the transaction was read at (409 when it changed since). */
  updateTransaction: (id: string, transactionId: string, input: TransactionInputDto) =>
    send(portfoliosRoutes.updateTransaction, { params: { id, transactionId }, body: input }),
  deleteTransaction: (id: string, transactionId: string) =>
    send(portfoliosRoutes.deleteTransaction, { params: { id, transactionId } }),
  /** The CSV or Excel file of the template: every row or none. */
  importTransactions: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return sendForm(portfoliosRoutes.importTransactions, form, { params: { id } })
  },
  /** Queues the PDF report, with the company logo if any. */
  requestReport: (id: string, request: ReportRequestDto, logo: File | null) => {
    const form = new FormData()
    form.append('options', JSON.stringify(request))
    if (logo) form.append('logo', logo)
    return sendForm(portfoliosRoutes.requestReport, form, { params: { id } })
  },
  reportJob: (jobId: string, signal?: AbortSignal) =>
    send(portfoliosRoutes.reportJob, { params: { jobId }, signal }),
  /** The PDF of a finished report (the job's downloadPath). */
  reportFile: (jobId: string, signal?: AbortSignal) =>
    sendBlob(portfoliosRoutes.reportFile, { params: { jobId }, signal }),
}
