import type {
  BeacAggregatesDto,
  BeacDecisionDto,
  BeacInterbankDto,
  BeacOperationsDto,
  BeacRateHistoryDto,
  BeacSummaryDto,
  CemacTableDto,
  CommodityCategory,
  CommodityComparisonDto,
  CommodityFrequency,
  CommodityHistoryDto,
  CommodityListItemDto,
  CommodityProfileDto,
  CommodityRelatedDto,
  DescriptionDto,
  DescriptionLanguage,
  FxConversionDto,
  FxHistoryDto,
  FxInterval,
  FxMatrixDto,
  FxRateDto,
  GlobalRatesSet,
  DocumentDto,
  HistoryPointDto,
  IndexConstituentsDto,
  IndexMemberDto,
  IndexPerformanceDto,
  IndexProfileDto,
  IndexQuoteDto,
  IndexSessionsDto,
  MacroComparisonDto,
  MacroCountryDto,
  MacroIndicatorInfoDto,
  MacroSummaryDto,
  MarketStatusDto,
  MarketSummaryDto,
  MoverDto,
  MoversType,
  PolicyRateDto,
  RateHistoryDto,
  RateOrigin,
  RateSeriesDto,
  SectorDto,
  TickerItemDto,
  XafCrossesDto,
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
 * rate series (spec section 11), the rates of screens 25 and 26, screen 26's exchange rates,
 * screen 25's macro indicators and screen 21's commodities.
 */
export const marketRoutes = {
  status: route('GET', '/market/status', answer<MarketStatusDto>()),
  summary: route('GET', '/market/summary', answer<MarketSummaryDto>()),
  movers: route('GET', '/market/movers', answer<MoverDto[]>()),
  ticker: route('GET', '/market/ticker', answer<TickerItemDto[]>()),
  sectors: route('GET', '/market/sectors', answer<SectorDto[]>()),
  indices: route('GET', '/indices', answer<IndexQuoteDto[]>()),
  indexHistory: route('GET', '/indices/{code}/history', answer<HistoryPointDto[]>()),
  indexDescription: route('GET', '/indices/{code}/description', answer<DescriptionDto>()),
  indexProfile: route('GET', '/indices/{code}', answer<IndexProfileDto>()),
  indexSessions: route('GET', '/indices/{code}/sessions', answer<IndexSessionsDto>()),
  indexConstituents: route('GET', '/indices/{code}/constituents', answer<IndexConstituentsDto>()),
  indexMembers: route('GET', '/indices/{code}/constituents/history', answer<IndexMemberDto[]>()),
  indexPerformance: route('GET', '/indices/{code}/performance', answer<IndexPerformanceDto>()),
  indexDocuments: route('GET', '/indices/{code}/documents', answer<DocumentDto[]>()),
  policyRates: route('GET', '/rates/policy', answer<PolicyRateDto[]>()),
  beacSummary: route('GET', '/beac/summary', answer<BeacSummaryDto>()),
  beacRateHistory: route('GET', '/beac/rates/history', answer<BeacRateHistoryDto>()),
  beacDecisions: route('GET', '/beac/decisions', answer<BeacDecisionDto[]>()),
  beacOperations: route('GET', '/beac/operations', answer<BeacOperationsDto>()),
  beacInterbank: route('GET', '/beac/interbank', answer<BeacInterbankDto>()),
  beacAggregates: route('GET', '/beac/aggregates', answer<BeacAggregatesDto>()),
  fx: route('GET', '/fx', answer<FxRateDto[]>()),
  xafCrosses: route('GET', '/fx/xaf-crosses', answer<XafCrossesDto>()),
  fxHistory: route('GET', '/fx/{ccy}/history', answer<FxHistoryDto>()),
  fxConvert: route('GET', '/fx/convert', answer<FxConversionDto>()),
  fxMatrix: route('GET', '/fx/matrix', answer<FxMatrixDto>()),
  rateSeries: route('GET', '/rates/series', answer<RateSeriesDto[]>()),
  rateHistory: route('GET', '/rates/{code}/history', answer<RateHistoryDto>()),
  globalRates: route('GET', '/macro/global-rates', answer<RateSeriesDto[]>()),
  macroCountries: route('GET', '/macro/countries', answer<MacroCountryDto[]>()),
  macroSummary: route('GET', '/macro/countries/{iso3}/summary', answer<MacroSummaryDto>()),
  macroIndicators: route('GET', '/macro/indicators', answer<MacroIndicatorInfoDto[]>()),
  macroCompare: route('GET', '/macro/compare', answer<MacroComparisonDto>()),
  cemacTable: route('GET', '/macro/cemac-table', answer<CemacTableDto>()),
  commodities: route('GET', '/commodities', answer<CommodityListItemDto[]>()),
  commodityCompare: route('GET', '/commodities/compare', answer<CommodityComparisonDto>()),
  commodity: route('GET', '/commodities/{code}', answer<CommodityProfileDto>()),
  commodityHistory: route('GET', '/commodities/{code}/history', answer<CommodityHistoryDto>()),
  commodityRelated: route('GET', '/commodities/{code}/related', answer<CommodityRelatedDto>()),
}

export const marketApi = {
  status: (signal?: AbortSignal) => send(marketRoutes.status, { signal }),
  summary: (signal?: AbortSignal) => send(marketRoutes.summary, { signal }),
  movers: (type: MoversType, signal?: AbortSignal) =>
    send(marketRoutes.movers, { query: { type }, signal }),
  ticker: (signal?: AbortSignal) => send(marketRoutes.ticker, { signal }),
  /** The issuers' sectors by their names in English and French (B17 of ROADMAP step 50). */
  sectors: (signal?: AbortSignal) => send(marketRoutes.sectors, { signal }),
  /** The indices CMarket computes or receives, e.g. for a portfolio's benchmark. */
  indices: (signal?: AbortSignal) => send(marketRoutes.indices, { signal }),
  indexHistory: (code: string, range: HistoryRange, signal?: AbortSignal) =>
    send(marketRoutes.indexHistory, { params: { code }, query: { ...range }, signal }),
  /** An index's description in a language, else in the other one (screen 31, fifth version). */
  indexDescription: (code: string, lang: DescriptionLanguage, signal?: AbortSignal) =>
    send(marketRoutes.indexDescription, { params: { code }, query: { lang }, signal }),
  /** The index profile (screen 31, fifth version): its header. */
  indexProfile: (code: string, signal?: AbortSignal) =>
    send(marketRoutes.indexProfile, { params: { code }, signal }),
  /** The latest sessions' values, newest first (10, 20 or 60 on the profile). */
  indexSessions: (code: string, last: number, signal?: AbortSignal) =>
    send(marketRoutes.indexSessions, { params: { code }, query: { last }, signal }),
  /** The composition in force on a session, the latest without a date. */
  indexConstituents: (code: string, date: string | null, signal?: AbortSignal) =>
    send(marketRoutes.indexConstituents, {
      params: { code },
      query: date ? { date } : {},
      signal,
    }),
  /** Every member the index had: the constituents' history. */
  indexMembers: (code: string, signal?: AbortSignal) =>
    send(marketRoutes.indexMembers, { params: { code }, signal }),
  indexPerformance: (code: string, signal?: AbortSignal) =>
    send(marketRoutes.indexPerformance, { params: { code }, signal }),
  /** Its methodology, notices and factsheets, newest first; the PDFs are /documents/{id}/file. */
  indexDocuments: (code: string, signal?: AbortSignal) =>
    send(marketRoutes.indexDocuments, { params: { code }, signal }),
  policyRates: (signal?: AbortSignal) => send(marketRoutes.policyRates, { signal }),
  /** BEAC (screen 34, sixth version): the indicators, the corridor since `from`, the meetings. */
  beacSummary: (signal?: AbortSignal) => send(marketRoutes.beacSummary, { signal }),
  beacRateHistory: (from: string, signal?: AbortSignal) =>
    send(marketRoutes.beacRateHistory, { query: { from }, signal }),
  beacDecisions: (signal?: AbortSignal) => send(marketRoutes.beacDecisions, { signal }),
  /** The tenders, the interbank market's latest week and the monetary aggregates. */
  beacOperations: (signal?: AbortSignal) => send(marketRoutes.beacOperations, { signal }),
  beacInterbank: (signal?: AbortSignal) => send(marketRoutes.beacInterbank, { signal }),
  beacAggregates: (signal?: AbortSignal) => send(marketRoutes.beacAggregates, { signal }),
  /** Pairs such as EURXAF. */
  fx: (pairs: readonly string[], signal?: AbortSignal) =>
    send(marketRoutes.fx, { query: { pairs: pairs.join(',') }, signal }),
  /** Screen 26: the parity and the Admin's currencies against the XAF, on a day (today without one). */
  xafCrosses: (date: string | undefined, signal?: AbortSignal) =>
    send(marketRoutes.xafCrosses, { query: { date }, signal }),
  /** A currency against the XAF, oldest first; ISO dates, each publication or each week's last. */
  fxHistory: (
    currency: string,
    range: { from?: string; to?: string; interval?: FxInterval },
    signal?: AbortSignal,
  ) => send(marketRoutes.fxHistory, { params: { ccy: currency }, query: { ...range }, signal }),
  /** An amount in another currency at the reference rates of a day; EUR and XAF at the parity. */
  fxConvert: (
    input: { amount: number; from: string; to: string; date?: string },
    signal?: AbortSignal,
  ) =>
    send(marketRoutes.fxConvert, {
      query: { amount: String(input.amount), from: input.from, to: input.to, date: input.date },
      signal,
    }),
  /** The cross rates of the currencies given, or the Admin's. */
  fxMatrix: (currencies: readonly string[] | undefined, signal?: AbortSignal) =>
    send(marketRoutes.fxMatrix, { query: { currencies: currencies?.join(',') }, signal }),
  /** The series CMarket follows, those of an origin or a country (ISO alpha-2) when given. */
  rateSeries: (filter: { origin?: RateOrigin; country?: string }, signal?: AbortSignal) =>
    send(marketRoutes.rateSeries, { query: { ...filter }, signal }),
  /** A series' points, oldest first; ISO dates. */
  rateHistory: (code: string, range: { from?: string; to?: string }, signal?: AbortSignal) =>
    send(marketRoutes.rateHistory, { params: { code }, query: { ...range }, signal }),
  globalRates: (set: GlobalRatesSet, signal?: AbortSignal) =>
    send(marketRoutes.globalRates, { query: { set }, signal }),
  /** ECO's selector: the CEMAC's six, Sub-Saharan Africa, the Admin's countries, the World. */
  macroCountries: (signal?: AbortSignal) => send(marketRoutes.macroCountries, { signal }),
  /** An economy's key indicator tiles, by its World Bank code ("CMR"). */
  macroSummary: (iso3: string, signal?: AbortSignal) =>
    send(marketRoutes.macroSummary, { params: { iso3 }, signal }),
  macroIndicators: (signal?: AbortSignal) => send(marketRoutes.macroIndicators, { signal }),
  /** An indicator's yearly figures for up to six economies, every year without a range. */
  macroCompare: (
    input: { countries: readonly string[]; indicator: string; from?: number; to?: number },
    signal?: AbortSignal,
  ) =>
    send(marketRoutes.macroCompare, {
      query: {
        countries: input.countries.join(','),
        indicator: input.indicator,
        from: input.from === undefined ? undefined : String(input.from),
        to: input.to === undefined ? undefined : String(input.to),
      },
      signal,
    }),
  /** The CEMAC's six and Sub-Saharan Africa on the indicators given, or the mockup's seven. */
  cemacTable: (indicators: readonly string[] | undefined, signal?: AbortSignal) =>
    send(marketRoutes.cemacTable, { query: { indicators: indicators?.join(',') }, signal }),
  /** Screen 21's list: every series, or a category's, in the list's order. */
  commodities: (category: CommodityCategory | undefined, signal?: AbortSignal) =>
    send(marketRoutes.commodities, { query: { category }, signal }),
  /** A commodity's profile by its code ("BRENT"). */
  commodity: (code: string, signal?: AbortSignal) =>
    send(marketRoutes.commodity, { params: { code }, signal }),
  /** A series' values of an interval it offers, oldest first; ISO dates, the whole history without. */
  commodityHistory: (
    code: string,
    range: { interval: CommodityFrequency; from?: string; to?: string },
    signal?: AbortSignal,
  ) => send(marketRoutes.commodityHistory, { params: { code }, query: { ...range }, signal }),
  /** Up to five series on their monthly values, rebased to 100, and their correlations. */
  commodityCompare: (
    input: { codes: readonly string[]; from?: string; to?: string },
    signal?: AbortSignal,
  ) =>
    send(marketRoutes.commodityCompare, {
      query: { codes: input.codes.join(','), from: input.from, to: input.to },
      signal,
    }),
  /** The CEMAC countries exposed, the related securities and the latest news. */
  commodityRelated: (code: string, signal?: AbortSignal) =>
    send(marketRoutes.commodityRelated, { params: { code }, signal }),
}
