import type {
  FxRateDto,
  GlobalRatesSet,
  HistoryPointDto,
  IndexQuoteDto,
  MarketStatusDto,
  MarketSummaryDto,
  MoverDto,
  MoversType,
  PolicyRateDto,
  RateHistoryDto,
  RateOrigin,
  RateSeriesDto,
  TickerItemDto,
} from '../contracts'
import { answer, route, send } from './define'

/** The dates and bar interval of a history, as the chart periods give them. */
export interface HistoryRange {
  from?: string
  to?: string
  interval?: string
}

/**
 * CMarket.Api/Controllers/Market: the session, the dashboard's panels, indices, rates and FX, the
 * rate series (spec section 11) and the rates of screens 25 and 26.
 */
export const marketRoutes = {
  status: route('GET', '/market/status', answer<MarketStatusDto>()),
  summary: route('GET', '/market/summary', answer<MarketSummaryDto>()),
  movers: route('GET', '/market/movers', answer<MoverDto[]>()),
  ticker: route('GET', '/market/ticker', answer<TickerItemDto[]>()),
  indices: route('GET', '/indices', answer<IndexQuoteDto[]>()),
  indexHistory: route('GET', '/indices/{code}/history', answer<HistoryPointDto[]>()),
  policyRates: route('GET', '/rates/policy', answer<PolicyRateDto[]>()),
  fx: route('GET', '/fx', answer<FxRateDto[]>()),
  rateSeries: route('GET', '/rates/series', answer<RateSeriesDto[]>()),
  rateHistory: route('GET', '/rates/{code}/history', answer<RateHistoryDto>()),
  globalRates: route('GET', '/macro/global-rates', answer<RateSeriesDto[]>()),
}

export const marketApi = {
  status: (signal?: AbortSignal) => send(marketRoutes.status, { signal }),
  summary: (signal?: AbortSignal) => send(marketRoutes.summary, { signal }),
  movers: (type: MoversType, signal?: AbortSignal) =>
    send(marketRoutes.movers, { query: { type }, signal }),
  ticker: (signal?: AbortSignal) => send(marketRoutes.ticker, { signal }),
  /** The indices CMarket computes or receives, e.g. for a portfolio's benchmark. */
  indices: (signal?: AbortSignal) => send(marketRoutes.indices, { signal }),
  indexHistory: (code: string, range: HistoryRange, signal?: AbortSignal) =>
    send(marketRoutes.indexHistory, { params: { code }, query: { ...range }, signal }),
  policyRates: (signal?: AbortSignal) => send(marketRoutes.policyRates, { signal }),
  /** Pairs such as EURXAF. */
  fx: (pairs: readonly string[], signal?: AbortSignal) =>
    send(marketRoutes.fx, { query: { pairs: pairs.join(',') }, signal }),
  /** The series CMarket follows, those of an origin or a country (ISO alpha-2) when given. */
  rateSeries: (filter: { origin?: RateOrigin; country?: string }, signal?: AbortSignal) =>
    send(marketRoutes.rateSeries, { query: { ...filter }, signal }),
  /** A series' points, oldest first; ISO dates. */
  rateHistory: (code: string, range: { from?: string; to?: string }, signal?: AbortSignal) =>
    send(marketRoutes.rateHistory, { params: { code }, query: { ...range }, signal }),
  globalRates: (set: GlobalRatesSet, signal?: AbortSignal) =>
    send(marketRoutes.globalRates, { query: { set }, signal }),
}
