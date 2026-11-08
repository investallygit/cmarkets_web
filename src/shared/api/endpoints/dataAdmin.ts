import type {
  CoverageDto,
  DocumentDto,
  DocumentWriteDto,
  EodhdStatusDto,
  ImportDto,
  ImportRowDto,
  ImportRowPatchDto,
  ImportRowStatus,
  ImportStatus,
  ImportType,
  ImportTypeDto,
  NewsArticleDto,
  NewsWriteDto,
  Paged,
  PriceCorrectionDto,
  PriceCorrectionRequestDto,
  StoredPriceDto,
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

/** The filters of the upload history (HIST) and of the session's uploads. */
export interface ImportQuery {
  status?: ImportStatus[]
  type?: ImportType
  /** Upload days, both included. */
  from?: string
  to?: string
  sessionDate?: string
  page?: number
  pageSize?: number
}

export interface UploadInput {
  type: ImportType
  sessionDate: string
  file: File
  /** Replace file: the upload not published yet that this one replaces. */
  replacesId?: string
}

/**
 * CMarket.Api/Controllers/DataAdmin: the Data admin's back-office (spec section 11): uploads and
 * their checks, the session's coverage, stored prices and their corrections, news and documents
 * entered by hand, the EODHD connector.
 */
export const dataAdminRoutes = {
  importTypes: route('GET', '/data/import-types', answer<ImportTypeDto[]>()),
  template: route('GET', '/data/import-types/{type}/template', answer<Blob>()),
  coverage: route('GET', '/data/coverage', answer<CoverageDto>()),
  imports: route('GET', '/data/imports', answer<Paged<ImportDto>>()),
  upload: route('POST', '/data/imports', answer<ImportDto>()),
  import: route('GET', '/data/imports/{id}', answer<ImportDto>()),
  rows: route('GET', '/data/imports/{id}/rows', answer<Paged<ImportRowDto>>()),
  patchRow: route('PATCH', '/data/imports/{id}/rows/{rowId}', answer<ImportRowDto>()),
  publish: route('POST', '/data/imports/{id}/publish', answer<ImportDto>()),
  rollBack: route('POST', '/data/imports/{id}/rollback', answer<ImportDto>()),
  discard: route('POST', '/data/imports/{id}/discard', answer<ImportDto>()),
  storedPrices: route('GET', '/data/securities/{id}/prices', answer<StoredPriceDto[]>()),
  correctPrice: route('PUT', '/data/securities/{id}/prices/{date}', answer<PriceCorrectionDto>()),
  corrections: route('GET', '/data/corrections', answer<Paged<PriceCorrectionDto>>()),
  eodhdStatus: route('GET', '/data/providers/eodhd/status', answer<EodhdStatusDto>()),
  createNews: route('POST', '/data/news', answer<NewsArticleDto>()),
  updateNews: route('PUT', '/data/news/{id}', answer<NewsArticleDto>()),
  createDocument: route('POST', '/data/documents', answer<DocumentDto>()),
  updateDocument: route('PUT', '/data/documents/{id}', answer<DocumentDto>()),
}

/** The multipart form of a document; an edit may leave the PDF out to keep the current one. */
function documentForm(document: DocumentWriteDto, file: File | null): FormData {
  const form = new FormData()
  form.set('type', document.type)
  form.set('title', document.title)
  form.set('source', document.source)
  document.securityIds.forEach((securityId) => form.append('securityIds', securityId))
  if (file) form.set('file', file)
  return form
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const dataAdminApi = {
  importTypes: (signal?: AbortSignal) => send(dataAdminRoutes.importTypes, { signal }),
  /** The template of a file type, in CSV or Excel. */
  template: (type: ImportType, format: 'csv' | 'xlsx') =>
    sendBlob(dataAdminRoutes.template, { params: { type }, query: { format } }),
  /** What a session has received; the latest one when no date is given. */
  coverage: (date: string | null, signal?: AbortSignal) =>
    send(dataAdminRoutes.coverage, { query: { date }, signal }),
  imports: (query: ImportQuery, signal?: AbortSignal) =>
    send(dataAdminRoutes.imports, { query: { ...query }, signal }),
  /** A file to check; a job then runs its checks, followed on the hub. */
  upload: ({ type, sessionDate, file, replacesId }: UploadInput) => {
    const form = new FormData()
    form.set('type', type)
    form.set('sessionDate', sessionDate)
    form.set('file', file)
    if (replacesId) form.set('replacesId', replacesId)
    return sendForm(dataAdminRoutes.upload, form)
  },
  import: (id: string, signal?: AbortSignal) => send(dataAdminRoutes.import, of(id, signal)),
  rows: (
    id: string,
    query: { status: ImportRowStatus | null; page: number; pageSize: number },
    signal?: AbortSignal,
  ) => send(dataAdminRoutes.rows, { ...of(id, signal), query }),
  /** A fix of a row, or its alert ticked. */
  patchRow: (id: string, rowId: string, patch: ImportRowPatchDto) =>
    send(dataAdminRoutes.patchRow, { params: { id, rowId }, body: patch }),
  publish: (id: string) => send(dataAdminRoutes.publish, { params: { id } }),
  rollBack: (id: string, reason: string) =>
    send(dataAdminRoutes.rollBack, { params: { id }, body: { reason } }),
  discard: (id: string) => send(dataAdminRoutes.discard, { params: { id } }),
  storedPrices: (id: string, from: string, to: string, signal?: AbortSignal) =>
    send(dataAdminRoutes.storedPrices, { ...of(id, signal), query: { from, to } }),
  /** A manual correction of a stored session, with its reason. */
  correctPrice: (id: string, date: string, correction: PriceCorrectionRequestDto) =>
    send(dataAdminRoutes.correctPrice, { params: { id, date }, body: correction }),
  corrections: (
    query: { securityId: string | null; page: number; pageSize: number },
    signal?: AbortSignal,
  ) => send(dataAdminRoutes.corrections, { query, signal }),
  eodhdStatus: (signal?: AbortSignal) => send(dataAdminRoutes.eodhdStatus, { signal }),
  /** News entered by the Data admin: a new item, or an edit of one. */
  saveNews: (id: string | null, news: NewsWriteDto) =>
    id
      ? send(dataAdminRoutes.updateNews, { params: { id }, body: news })
      : send(dataAdminRoutes.createNews, { body: news }),
  saveDocument: (id: string | null, document: DocumentWriteDto, file: File | null) =>
    id
      ? sendForm(dataAdminRoutes.updateDocument, documentForm(document, file), { params: { id } })
      : sendForm(dataAdminRoutes.createDocument, documentForm(document, file)),
}
