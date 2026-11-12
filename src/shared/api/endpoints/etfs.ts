import type {
  EtfAllocationBy,
  EtfAllocationDto,
  EtfAnnualReturnsDto,
  EtfDistributionsDto,
  EtfDto,
  EtfFacetsDto,
  EtfHistoryDayDto,
  EtfHistorySeries,
  EtfHoldingsDto,
  EtfPerformanceDto,
  EtfPeriod,
  EtfScreenerQuery,
  EtfScreenerResultDto,
  IsoDate,
} from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Etfs: ETFS (screen 15) and the reads of the ETF profile (screen 19). */
export const etfsRoutes = {
  screener: route('GET', '/etfs', answer<EtfScreenerResultDto>()),
  facets: route('GET', '/etfs/facets', answer<EtfFacetsDto>()),
  etf: route('GET', '/etfs/{id}', answer<EtfDto>()),
  performance: route('GET', '/etfs/{id}/performance', answer<EtfPerformanceDto>()),
  distributions: route('GET', '/etfs/{id}/distributions', answer<EtfDistributionsDto>()),
  history: route('GET', '/etfs/{id}/history', answer<EtfHistoryDayDto[]>()),
  holdings: route('GET', '/etfs/{id}/holdings', answer<EtfHoldingsDto>()),
  allocation: route('GET', '/etfs/{id}/allocation', answer<EtfAllocationDto>()),
  annualReturns: route('GET', '/etfs/{id}/annual-returns', answer<EtfAnnualReturnsDto>()),
}

/** GET /etfs/{id}/history: the period (the last year without it), by day or by week, and what each day adds. */
export interface EtfHistoryQuery {
  from?: IsoDate
  to?: IsoDate
  interval?: '1d' | '1w'
  with?: readonly EtfHistorySeries[]
}

export const etfsApi = {
  /** ETFS: the ETFs of the latest calculation that meet every criterion. */
  screener: (query: EtfScreenerQuery, signal?: AbortSignal) =>
    send(etfsRoutes.screener, { query: { ...query }, signal }),
  /** The values of each filter, with their counts. */
  facets: (signal?: AbortSignal) => send(etfsRoutes.facets, { signal }),
  /** Blocks A to D of an ETF. */
  etf: (id: string, signal?: AbortSignal) => send(etfsRoutes.etf, { params: { id }, signal }),
  /** Block E over the periods asked, every period without them. */
  performance: (id: string, periods: readonly EtfPeriod[] | null, signal?: AbortSignal) =>
    send(etfsRoutes.performance, {
      params: { id },
      query: periods ? { periods: periods.join(',') } : {},
      signal,
    }),
  /** What the fund paid, the latest first. */
  distributions: (id: string, signal?: AbortSignal) =>
    send(etfsRoutes.distributions, { params: { id }, signal }),
  /** The sessions of the period, by day or by week, with the NAV, the total return or the index. */
  history: (id: string, query: EtfHistoryQuery, signal?: AbortSignal) =>
    send(etfsRoutes.history, {
      params: { id },
      query: {
        from: query.from,
        to: query.to,
        interval: query.interval,
        with: query.with && query.with.length > 0 ? query.with.join(',') : undefined,
      },
      signal,
    }),
  /** The fund's largest lines (the top ones, all those known without top) and their number in all. */
  holdings: (id: string, top: number | null, signal?: AbortSignal) =>
    send(etfsRoutes.holdings, { params: { id }, query: top === null ? {} : { top }, signal }),
  /** The fund's weights by sector or by region. */
  allocation: (id: string, by: EtfAllocationBy, signal?: AbortSignal) =>
    send(etfsRoutes.allocation, { params: { id }, query: { by }, signal }),
  /** Each calendar year's return, the fund's and its index's, the latest first. */
  annualReturns: (id: string, signal?: AbortSignal) =>
    send(etfsRoutes.annualReturns, { params: { id }, signal }),
}
