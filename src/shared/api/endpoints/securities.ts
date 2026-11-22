import type {
  DescriptionDto,
  DescriptionLanguage,
  DividendDto,
  PriceBarDto,
  QuoteDto,
  SearchResultsDto,
  SecurityListItemDto,
  SecurityProfileDto,
  SecuritySessionsDto,
  SecurityType,
  ShareholdersDto,
} from '../contracts'
import { answer, route, send } from './define'
import type { HistoryRange } from './market'

/** The filters of GET /securities. */
export interface SecurityFilters {
  type?: SecurityType
  sector?: string
  country?: string
  /** Exchange code, e.g. "BVMAC". */
  market?: string
}

/** CMarket.Api/Controllers/Securities: the search, the list and each security's data. */
export const securitiesRoutes = {
  search: route('GET', '/search', answer<SearchResultsDto>()),
  list: route('GET', '/securities', answer<SecurityListItemDto[]>()),
  profile: route('GET', '/securities/{id}', answer<SecurityProfileDto>()),
  quote: route('GET', '/securities/{id}/quote', answer<QuoteDto>()),
  history: route('GET', '/securities/{id}/history', answer<PriceBarDto[]>()),
  sessions: route('GET', '/securities/{id}/sessions', answer<SecuritySessionsDto>()),
  description: route('GET', '/securities/{id}/description', answer<DescriptionDto>()),
  dividends: route('GET', '/securities/{id}/dividends', answer<DividendDto[]>()),
  shareholders: route('GET', '/securities/{id}/shareholders', answer<ShareholdersDto>()),
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const securitiesApi = {
  /** Autocomplete of the command bar. */
  search: (q: string, signal?: AbortSignal) =>
    send(securitiesRoutes.search, { query: { q }, signal }),
  list: (filters: SecurityFilters, signal?: AbortSignal) =>
    send(securitiesRoutes.list, { query: { ...filters }, signal }),
  profile: (id: string, signal?: AbortSignal) => send(securitiesRoutes.profile, of(id, signal)),
  /** The last fixing behind the live values, its date and the previous one's price. */
  quote: (id: string, signal?: AbortSignal) => send(securitiesRoutes.quote, of(id, signal)),
  history: (id: string, range: HistoryRange, signal?: AbortSignal) =>
    send(securitiesRoutes.history, { ...of(id, signal), query: { ...range } }),
  /** The latest sessions with trades, newest first (fifth version, in place of the order book). */
  sessions: (id: string, last: number, signal?: AbortSignal) =>
    send(securitiesRoutes.sessions, { ...of(id, signal), query: { last } }),
  /** The description in a language, else in the other one; 404 when none is written. */
  description: (id: string, lang: DescriptionLanguage, signal?: AbortSignal) =>
    send(securitiesRoutes.description, { ...of(id, signal), query: { lang } }),
  dividends: (id: string, signal?: AbortSignal) => send(securitiesRoutes.dividends, of(id, signal)),
  shareholders: (id: string, signal?: AbortSignal) =>
    send(securitiesRoutes.shareholders, of(id, signal)),
}
