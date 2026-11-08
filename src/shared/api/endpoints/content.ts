import type {
  CalendarEventDto,
  CalendarEventType,
  DocumentDto,
  DocumentType,
  NewsArticleDto,
  NewsItemDto,
  NewsTopic,
  Paged,
} from '../contracts'
import { answer, route, send, sendBlob } from './define'

export interface NewsFilters {
  topic?: NewsTopic
  securityId?: string
  country?: string
}

export interface DocumentFilters {
  securityId?: string
  type?: DocumentType
  /** Full-text search (spec section 5). */
  q?: string
}

export interface CalendarRange {
  from: string
  to: string
  /** All types when empty. */
  types?: readonly CalendarEventType[]
  /** A country keeps the regional events too. */
  country?: string
}

export interface Page {
  page: number
  pageSize: number
}

/** CMarket.Api/Controllers/Content: the news feed, the document library and the calendar. */
export const contentRoutes = {
  news: route('GET', '/news', answer<Paged<NewsItemDto>>()),
  article: route('GET', '/news/{id}', answer<NewsArticleDto>()),
  documents: route('GET', '/documents', answer<Paged<DocumentDto>>()),
  documentFile: route('GET', '/documents/{id}/file', answer<Blob>()),
  calendar: route('GET', '/calendar', answer<CalendarEventDto[]>()),
}

export const contentApi = {
  /** The feed, newest first, filtered by topic, security or country. */
  news: (filters: NewsFilters, page: Page, signal?: AbortSignal) =>
    send(contentRoutes.news, { query: { ...filters, ...page }, signal }),
  /** The full article. */
  article: (id: string, signal?: AbortSignal) =>
    send(contentRoutes.article, { params: { id }, signal }),
  /** Issuer releases, reports, notices and decisions, newest first. */
  documents: (filters: DocumentFilters, page: Page, signal?: AbortSignal) =>
    send(contentRoutes.documents, { query: { ...filters, ...page }, signal }),
  /** The PDF, which never changes once published. */
  documentFile: (id: string, signal?: AbortSignal) =>
    sendBlob(contentRoutes.documentFile, { params: { id }, signal }),
  calendar: ({ from, to, types, country }: CalendarRange, signal?: AbortSignal) =>
    send(contentRoutes.calendar, { query: { from, to, type: types, country }, signal }),
}
