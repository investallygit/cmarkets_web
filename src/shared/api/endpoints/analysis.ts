import type {
  ComparisonItemDto,
  FinancialStatement,
  FinancialStatementDto,
  IndicatorDto,
  IndicatorType,
  RatiosDto,
  SavedBondScreenDto,
  SavedBondScreenInputDto,
  SavedEtfScreenDto,
  SavedEtfScreenInputDto,
  SavedScreenDto,
  SavedScreenInputDto,
  ScreenerRequestDto,
  ScreenerResultDto,
} from '../contracts'
import { answer, route, send } from './define'
import type { HistoryRange } from './market'

/**
 * CMarket.Api/Controllers/Analysis: the fundamentals of a security, the peer comparison, the
 * screener and its saved screens, the technical indicators.
 */
export const analysisRoutes = {
  financials: route('GET', '/securities/{id}/financials', answer<FinancialStatementDto>()),
  ratios: route('GET', '/securities/{id}/ratios', answer<RatiosDto>()),
  compare: route('GET', '/analysis/compare', answer<ComparisonItemDto[]>()),
  screener: route('POST', '/analysis/screener', answer<ScreenerResultDto>()),
  screens: route('GET', '/analysis/screens', answer<SavedScreenDto[]>()),
  saveScreen: route('POST', '/analysis/screens', answer<SavedScreenDto>()),
  deleteScreen: route('DELETE', '/analysis/screens/{id}'),
  bondScreens: route('GET', '/analysis/bond-screens', answer<SavedBondScreenDto[]>()),
  saveBondScreen: route('POST', '/analysis/bond-screens', answer<SavedBondScreenDto>()),
  deleteBondScreen: route('DELETE', '/analysis/bond-screens/{id}'),
  etfScreens: route('GET', '/analysis/etf-screens', answer<SavedEtfScreenDto[]>()),
  saveEtfScreen: route('POST', '/analysis/etf-screens', answer<SavedEtfScreenDto>()),
  deleteEtfScreen: route('DELETE', '/analysis/etf-screens/{id}'),
  indicator: route('GET', '/indicators/{securityId}', answer<IndicatorDto>()),
}

export const analysisApi = {
  /** A statement over the last `years` fiscal years. */
  financials: (
    id: string,
    query: { statement: FinancialStatement; years: number },
    signal?: AbortSignal,
  ) => send(analysisRoutes.financials, { params: { id }, query, signal }),
  /** An equity's ratios and its sector's averages. */
  ratios: (id: string, signal?: AbortSignal) =>
    send(analysisRoutes.ratios, { params: { id }, signal }),
  /** The ratios of a peer group. */
  compare: (ids: readonly string[], signal?: AbortSignal) =>
    send(analysisRoutes.compare, { query: { ids: ids.join(',') }, signal }),
  /** Runs a screen: reads data, changes nothing. */
  screener: (request: ScreenerRequestDto, signal?: AbortSignal) =>
    send(analysisRoutes.screener, { body: request, signal }),
  screens: (signal?: AbortSignal) => send(analysisRoutes.screens, { signal }),
  saveScreen: (input: SavedScreenInputDto) => send(analysisRoutes.saveScreen, { body: input }),
  deleteScreen: (id: string) => send(analysisRoutes.deleteScreen, { params: { id } }),
  /** BS's saved screens. */
  bondScreens: (signal?: AbortSignal) => send(analysisRoutes.bondScreens, { signal }),
  saveBondScreen: (input: SavedBondScreenInputDto) =>
    send(analysisRoutes.saveBondScreen, { body: input }),
  deleteBondScreen: (id: string) => send(analysisRoutes.deleteBondScreen, { params: { id } }),
  /** ETFS's saved screens. */
  etfScreens: (signal?: AbortSignal) => send(analysisRoutes.etfScreens, { signal }),
  saveEtfScreen: (input: SavedEtfScreenInputDto) =>
    send(analysisRoutes.saveEtfScreen, { body: input }),
  deleteEtfScreen: (id: string) => send(analysisRoutes.deleteEtfScreen, { params: { id } }),
  /** A technical indicator over a chart period, computed by the server. */
  indicator: (
    securityId: string,
    indicator: { type: IndicatorType; period: number },
    range: HistoryRange,
    signal?: AbortSignal,
  ) =>
    send(analysisRoutes.indicator, {
      params: { securityId },
      query: { ...indicator, ...range },
      signal,
    }),
}
