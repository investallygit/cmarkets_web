import type {
  DividendDto,
  OrderBookDto,
  PriceBarDto,
  QuoteDto,
  SearchResultsDto,
  SecurityListItemDto,
  SecurityProfileDto,
  SecurityType,
  ShareholdersDto,
  TradeDto,
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
  orderBook: route('GET', '/securities/{id}/orderbook', answer<OrderBookDto>()),
  trades: route('GET', '/securities/{id}/trades', answer<TradeDto[]>()),
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
  /** The snapshot behind the live values, with the session's open, high and low. */
  quote: (id: string, signal?: AbortSignal) => send(securitiesRoutes.quote, of(id, signal)),
  history: (id: string, range: HistoryRange, signal?: AbortSignal) =>
    send(securitiesRoutes.history, { ...of(id, signal), query: { ...range } }),
  /** Best limits; not part of a Student account (spec section 12). */
  orderBook: (id: string, signal?: AbortSignal) => send(securitiesRoutes.orderBook, of(id, signal)),
  trades: (id: string, signal?: AbortSignal) => send(securitiesRoutes.trades, of(id, signal)),
  dividends: (id: string, signal?: AbortSignal) => send(securitiesRoutes.dividends, of(id, signal)),
  shareholders: (id: string, signal?: AbortSignal) =>
    send(securitiesRoutes.shareholders, of(id, signal)),
}
