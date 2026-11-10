import type {
  CalendarEventDto,
  CalendarEventType,
  DocumentDto,
  DocumentType,
  NewsArticleDto,
  NewsCategory,
  NewsChannel,
  NewsItemDto,
  NewsSourceDto,
  NewsType,
  Paged,
} from '../contracts'
import { answer, route, send, sendBlob } from './define'

/** The filters of the feed (spec section 10): each narrows it, none means every item. */
export interface NewsFilters {
  type?: NewsType
  channel?: NewsChannel
  sourceId?: string
  securityId?: string
  /** That country's items, those of the whole region included. */
  country?: string
  category?: NewsCategory
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
  newsSources: route('GET', '/news/sources', answer<NewsSourceDto[]>()),
  article: route('GET', '/news/{id}', answer<NewsArticleDto>()),
  newsView: route('POST', '/news/{id}/view'),
  documents: route('GET', '/documents', answer<Paged<DocumentDto>>()),
  documentFile: route('GET', '/documents/{id}/file', answer<Blob>()),
  calendar: route('GET', '/calendar', answer<CalendarEventDto[]>()),
}

export const contentApi = {
  /** The feed, newest first, filtered by type, channel, newspaper, security, country, category. */
  news: (filters: NewsFilters, page: Page, signal?: AbortSignal) =>
    send(contentRoutes.news, { query: { ...filters, ...page }, signal }),
  /** The newspapers of the feed, by short name. */
  newsSources: (signal?: AbortSignal) => send(contentRoutes.newsSources, { signal }),
  /** The content of an item. */
  article: (id: string, signal?: AbortSignal) =>
    send(contentRoutes.article, { params: { id }, signal }),
  /**
   * The unique click: the content showed 3 seconds in an active tab. Always 204; only the first
   * view of a user counts (spec section 16).
   */
  newsView: (id: string) => send(contentRoutes.newsView, { params: { id } }),
  /** Issuer releases, reports, notices and decisions, newest first. */
  documents: (filters: DocumentFilters, page: Page, signal?: AbortSignal) =>
    send(contentRoutes.documents, { query: { ...filters, ...page }, signal }),
  /** The PDF, which never changes once published. */
  documentFile: (id: string, signal?: AbortSignal) =>
    sendBlob(contentRoutes.documentFile, { params: { id }, signal }),
  calendar: ({ from, to, types, country }: CalendarRange, signal?: AbortSignal) =>
    send(contentRoutes.calendar, { query: { from, to, type: types, country }, signal }),
}
