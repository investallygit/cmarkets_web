import type { DocumentDto, DocumentWriteDto, NewsArticleDto, NewsWriteDto } from '../contracts'
import { answer, route, send, sendForm } from './define'

/** CMarket.Api/Controllers/DataAdmin: the Data admin's back-office (spec section 11). */
export const dataAdminRoutes = {
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

export const dataAdminApi = {
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
