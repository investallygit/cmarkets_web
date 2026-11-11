import type {
  NewsEarningsDto,
  NewsImportDto,
  NewsImportRowDto,
  NewsImportRowFixDto,
  NewsImportRowStatus,
  NewsPublishDto,
  NewsStatsDto,
  NewsStudioFileDto,
  NewsType,
  Paged,
  ProviderStatementDto,
  ProviderNewsDto,
  ProviderNewsRowDto,
  ProviderNewsStatus,
  ProviderNewsWriteDto,
  ProviderSourceDto,
  ProviderSourceWriteDto,
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

/** The filters of My news. */
export interface ProviderNewsQuery {
  status: ProviderNewsStatus | null
  type: NewsType | null
  page?: number
  pageSize?: number
}

/**
 * CMarket.Api/Controllers/Provider: NEWS NEW, the studio of an approved News provider (screen 13,
 * spec sections 10 and 16): its newspaper's items, their files, their clicks and earnings, the
 * newspaper itself and the file import; its monthly statements and their disputes (ROADMAP step 28).
 */
export const providerRoutes = {
  myNews: route('GET', '/provider/news', answer<Paged<ProviderNewsRowDto>>()),
  createNews: route('POST', '/provider/news', answer<ProviderNewsDto>()),
  news: route('GET', '/provider/news/{id}', answer<ProviderNewsDto>()),
  saveNews: route('PUT', '/provider/news/{id}', answer<ProviderNewsDto>()),
  publishNews: route('POST', '/provider/news/{id}/publish', answer<ProviderNewsDto>()),
  withdrawNews: route('POST', '/provider/news/{id}/withdraw', answer<ProviderNewsDto>()),
  uploadFile: route('POST', '/provider/news/{id}/attachments', answer<NewsStudioFileDto>()),
  removeFile: route('DELETE', '/provider/news/{id}/attachments/{fileId}'),
  template: route('GET', '/provider/news/template', answer<Blob>()),
  stats: route('GET', '/provider/news/stats', answer<NewsStatsDto>()),
  earnings: route('GET', '/provider/earnings', answer<NewsEarningsDto>()),
  source: route('GET', '/provider/source', answer<ProviderSourceDto>()),
  updateSource: route('PUT', '/provider/source', answer<ProviderSourceDto>()),
  imports: route('GET', '/provider/news/imports', answer<Paged<NewsImportDto>>()),
  upload: route('POST', '/provider/news/imports', answer<NewsImportDto>()),
  import: route('GET', '/provider/news/imports/{id}', answer<NewsImportDto>()),
  importRows: route('GET', '/provider/news/imports/{id}/rows', answer<Paged<NewsImportRowDto>>()),
  fixRow: route('PATCH', '/provider/news/imports/{id}/rows/{rowId}', answer<NewsImportRowDto>()),
  publishImport: route('POST', '/provider/news/imports/{id}/publish', answer<NewsImportDto>()),
  statements: route('GET', '/provider/statements', answer<ProviderStatementDto[]>()),
  statementPdf: route('GET', '/provider/statements/{id}/pdf', answer<Blob>()),
  disputeStatement: route(
    'POST',
    '/provider/statements/{id}/dispute',
    answer<ProviderStatementDto>(),
  ),
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const providerApi = {
  myNews: (query: ProviderNewsQuery, signal?: AbortSignal) =>
    send(providerRoutes.myNews, { query: { ...query }, signal }),
  /** A draft of the type chosen. */
  createNews: (type: NewsType) => send(providerRoutes.createNews, { body: { type } }),
  news: (id: string, signal?: AbortSignal) => send(providerRoutes.news, of(id, signal)),
  /** The editor's save, with the version it read (409 when another save came between). */
  saveNews: (id: string, news: ProviderNewsWriteDto) =>
    send(providerRoutes.saveNews, { params: { id }, body: news }),
  /** Now, or at a time of Douala; the rights certified. */
  publishNews: (id: string, publication: NewsPublishDto) =>
    send(providerRoutes.publishNews, { params: { id }, body: publication }),
  withdrawNews: (id: string, reason: string) =>
    send(providerRoutes.withdrawNews, { params: { id }, body: { reason } }),
  /** An image of the body with its credit, or the PDF; an ARTICLE's only. */
  uploadFile: (id: string, file: File, credit: string | null) => {
    const form = new FormData()
    form.set('file', file)
    if (credit) form.set('credit', credit)
    return sendForm(providerRoutes.uploadFile, form, { params: { id } })
  },
  removeFile: (id: string, fileId: string) =>
    send(providerRoutes.removeFile, { params: { id, fileId } }),
  /** The template of the file import, in CSV or Excel. */
  template: (format: 'csv' | 'xlsx') => sendBlob(providerRoutes.template, { query: { format } }),
  /** All the clicks by item, or the last 30 days by day. */
  stats: (groupBy: 'item' | 'day', signal?: AbortSignal) =>
    send(providerRoutes.stats, { query: { groupBy }, signal }),
  /** The current month's by default. */
  earnings: (month: string | null, signal?: AbortSignal) =>
    send(providerRoutes.earnings, { query: { month }, signal }),
  source: (signal?: AbortSignal) => send(providerRoutes.source, { signal }),
  updateSource: (source: ProviderSourceWriteDto) =>
    send(providerRoutes.updateSource, { body: source }),
  imports: (query: { page: number; pageSize: number }, signal?: AbortSignal) =>
    send(providerRoutes.imports, { query, signal }),
  /** A CSV, XLSX or ZIP file; a job then checks it. */
  upload: (file: File) => {
    const form = new FormData()
    form.set('file', file)
    return sendForm(providerRoutes.upload, form)
  },
  import: (id: string, signal?: AbortSignal) => send(providerRoutes.import, of(id, signal)),
  importRows: (
    id: string,
    query: { status: NewsImportRowStatus | null; page: number; pageSize: number },
    signal?: AbortSignal,
  ) => send(providerRoutes.importRows, { ...of(id, signal), query }),
  fixRow: (id: string, rowId: number, fix: NewsImportRowFixDto) =>
    send(providerRoutes.fixRow, { params: { id, rowId }, body: fix }),
  publishImport: (id: string) => send(providerRoutes.publishImport, { params: { id } }),
  /** The newspaper's monthly statements, the latest first. */
  statements: (signal?: AbortSignal) => send(providerRoutes.statements, { signal }),
  /** An approved statement's PDF. */
  statementPdf: (id: string) => sendBlob(providerRoutes.statementPdf, { params: { id } }),
  /** An approved statement disputed within the window, with a reason. */
  disputeStatement: (id: string, reason: string) =>
    send(providerRoutes.disputeStatement, { params: { id }, body: { reason } }),
}
