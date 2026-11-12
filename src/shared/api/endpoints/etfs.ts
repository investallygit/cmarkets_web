import type {
  EtfDistributionsDto,
  EtfDto,
  EtfFacetsDto,
  EtfPerformanceDto,
  EtfPeriod,
  EtfScreenerQuery,
  EtfScreenerResultDto,
} from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Etfs: ETFS (screen 15) and the reads of the ETF profile (screen 19). */
export const etfsRoutes = {
  screener: route('GET', '/etfs', answer<EtfScreenerResultDto>()),
  facets: route('GET', '/etfs/facets', answer<EtfFacetsDto>()),
  etf: route('GET', '/etfs/{id}', answer<EtfDto>()),
  performance: route('GET', '/etfs/{id}/performance', answer<EtfPerformanceDto>()),
  distributions: route('GET', '/etfs/{id}/distributions', answer<EtfDistributionsDto>()),
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
}
