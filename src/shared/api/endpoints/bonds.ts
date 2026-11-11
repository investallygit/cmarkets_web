import type {
  AuctionDto,
  AuctionInstrument,
  BondAnalyticsDayDto,
  BondAnalyticsDto,
  BondCalculationDto,
  BondCalculationRequestDto,
  BondDto,
  BondPriceDto,
  BondPriceRequestDto,
  BondScreenerFacetsDto,
  BondScreenerQuery,
  BondScreenerResultDto,
  BondSummaryDto,
  MarketYieldDto,
  PriceYieldCurveDto,
  YieldCurveDto,
} from '../contracts'
import { answer, route, send } from './define'

export interface AuctionQuery {
  country?: string
  instrument?: AuctionInstrument
}

export interface PriceYieldQuery {
  /** The lowest and highest yields, in percent: 3 points either side of the market yield without them. */
  from?: number
  to?: number
  /** In points: 0.25 by default. */
  step?: number
  settlementDate?: string
}

export interface YieldCurveQuery {
  /** The latest session when absent. */
  date?: string
  /** Every CEMAC country when absent. */
  country?: string
}

/** CMarket.Api/Controllers/Bonds: listed bonds, the calculator, BP, the BEAC auctions, the curves, BS. */
export const bondsRoutes = {
  list: route('GET', '/bonds', answer<BondSummaryDto[]>()),
  bond: route('GET', '/bonds/{id}', answer<BondDto>()),
  calculate: route('POST', '/bonds/{id}/calculate', answer<BondCalculationDto>()),
  price: route('POST', '/bonds/price', answer<BondPriceDto>()),
  marketYield: route('GET', '/bonds/{id}/market-yield', answer<MarketYieldDto>()),
  priceYield: route('GET', '/bonds/{id}/price-yield', answer<PriceYieldCurveDto>()),
  auctions: route('GET', '/auctions', answer<AuctionDto[]>()),
  yieldCurves: route('GET', '/yield-curves', answer<YieldCurveDto[]>()),
  screener: route('GET', '/bonds/screener', answer<BondScreenerResultDto>()),
  screenerFacets: route('GET', '/bonds/screener/facets', answer<BondScreenerFacetsDto>()),
  analytics: route('GET', '/bonds/{id}/analytics', answer<BondAnalyticsDto>()),
  analyticsHistory: route('GET', '/bonds/{id}/analytics/history', answer<BondAnalyticsDayDto[]>()),
}

export const bondsApi = {
  /** Listed bonds and government securities. */
  list: (signal?: AbortSignal) => send(bondsRoutes.list, { signal }),
  /** Terms and cash-flow schedule. */
  bond: (id: string, signal?: AbortSignal) => send(bondsRoutes.bond, { params: { id }, signal }),
  /** The calculator (spec section 14.1): reads data, changes nothing. */
  calculate: (id: string, request: BondCalculationRequestDto, signal?: AbortSignal) =>
    send(bondsRoutes.calculate, { params: { id }, body: request, signal }),
  /** BP (spec screen 16): a bond of the list or entered by hand, priced at a yield; changes nothing. */
  price: (request: BondPriceRequestDto, signal?: AbortSignal) =>
    send(bondsRoutes.price, { body: request, signal }),
  /** The yield BP starts from (BS, else the curve and a spread) and the market's settlement. */
  marketYield: (id: string, signal?: AbortSignal) =>
    send(bondsRoutes.marketYield, { params: { id }, signal }),
  /** The clean price at each yield of a range. */
  priceYield: (id: string, query: PriceYieldQuery, signal?: AbortSignal) =>
    send(bondsRoutes.priceYield, { params: { id }, query: { ...query }, signal }),
  /** BEAC auction results, newest first. */
  auctions: (query: AuctionQuery, signal?: AbortSignal) =>
    send(bondsRoutes.auctions, { query: { ...query }, signal }),
  /** One curve per country, shortest maturity first. */
  yieldCurves: (query: YieldCurveQuery, signal?: AbortSignal) =>
    send(bondsRoutes.yieldCurves, { query: { ...query }, signal }),
  /** BS: the bonds of the latest daily calculation that meet every criterion. */
  screener: (query: BondScreenerQuery, signal?: AbortSignal) =>
    send(bondsRoutes.screener, { query: { ...query }, signal }),
  /** The values each filter finds in the latest calculation. */
  screenerFacets: (signal?: AbortSignal) => send(bondsRoutes.screenerFacets, { signal }),
  /** The selected bond's blocks A to D. */
  analytics: (id: string, signal?: AbortSignal) =>
    send(bondsRoutes.analytics, { params: { id }, signal }),
  /** The bond's daily calculations, oldest first; the last year by default. */
  analyticsHistory: (id: string, query: { from?: string; to?: string }, signal?: AbortSignal) =>
    send(bondsRoutes.analyticsHistory, { params: { id }, query: { ...query }, signal }),
}
