import type {
  AuctionDetailDto,
  AuctionDto,
  AuctionInstrument,
  AuctionRatesDto,
  AuctionSummaryDto,
  PlannedAuctionDto,
  PublicOfferDto,
  PublicOfferStatus,
  BondAnalyticsDayDto,
  BondAnalyticsDto,
  BondCashFlowsDto,
  BondCalculationDto,
  BondCalculationRequestDto,
  BondDto,
  BondPriceDto,
  BondPriceRequestDto,
  BondRatingsDto,
  BondScreenerFacetsDto,
  BondScreenerQuery,
  BondScreenerResultDto,
  BondSummaryDto,
  CurveDto,
  CurveSummaryDto,
  MarketYieldDto,
  PriceYieldCurveDto,
  YieldCurveDto,
} from '../contracts'
import { answer, route, send } from './define'

export interface AuctionQuery {
  country?: string
  instrument?: AuctionInstrument
  /** Both included (sixth version, screen 33). */
  from?: string
  to?: string
}

/** AUC's indicators and results (screen 33): a year, a state, BTA or OTA. */
export interface AuctionSummaryQuery {
  year?: number
  country?: string
  type?: AuctionInstrument
}

export interface AuctionRatesQuery {
  /** "52W" by default, "26W", "13W", "2Y", "3Y", "5Y"… */
  tenor?: string
  /** "CM,GA"; every CEMAC state by default. */
  countries?: string
}

export interface PriceYieldQuery {
  /** The lowest and highest yields, in percent: 3 points either side of the market yield without them. */
  from?: number
  to?: number
  /** In points: 0.25 by default. */
  step?: number
  settlementDate?: string
}

/** BP's curves (fifth version): CMarket's of each country on the session, and the custom curves. */
export interface CurveQuery {
  /** Every CEMAC country when absent. */
  country?: string
  /** The latest session when absent. */
  date?: string
}

export interface YieldCurveQuery {
  /** The latest session when absent. */
  date?: string
  /** Every CEMAC country when absent. */
  country?: string
}

/** The bond profile's history (screen 20): the last year without bounds. */
export interface BondHistoryQuery {
  from?: string
  to?: string
}

/** CMarket.Api/Controllers/Bonds: listed bonds, the calculator, BP, the BEAC auctions, the curves, BS, the bond profile. */
export const bondsRoutes = {
  list: route('GET', '/bonds', answer<BondSummaryDto[]>()),
  bond: route('GET', '/bonds/{id}', answer<BondDto>()),
  calculate: route('POST', '/bonds/{id}/calculate', answer<BondCalculationDto>()),
  price: route('POST', '/bonds/price', answer<BondPriceDto>()),
  marketYield: route('GET', '/bonds/{id}/market-yield', answer<MarketYieldDto>()),
  priceYield: route('GET', '/bonds/{id}/price-yield', answer<PriceYieldCurveDto>()),
  auctions: route('GET', '/auctions', answer<AuctionDto[]>()),
  auctionSummary: route('GET', '/auctions/summary', answer<AuctionSummaryDto>()),
  auctionRates: route('GET', '/auctions/rates', answer<AuctionRatesDto>()),
  auction: route('GET', '/auctions/{id}', answer<AuctionDetailDto>()),
  publicOffers: route('GET', '/public-offers', answer<PublicOfferDto[]>()),
  yieldCurves: route('GET', '/yield-curves', answer<YieldCurveDto[]>()),
  screener: route('GET', '/bonds/screener', answer<BondScreenerResultDto>()),
  screenerFacets: route('GET', '/bonds/screener/facets', answer<BondScreenerFacetsDto>()),
  analytics: route('GET', '/bonds/{id}/analytics', answer<BondAnalyticsDto>()),
  analyticsHistory: route('GET', '/bonds/{id}/analytics/history', answer<BondAnalyticsDayDto[]>()),
  ratings: route('GET', '/bonds/{id}/ratings', answer<BondRatingsDto>()),
  cashFlows: route('GET', '/bonds/{id}/cashflows', answer<BondCashFlowsDto>()),
  curves: route('GET', '/curves', answer<CurveSummaryDto[]>()),
  curve: route('GET', '/curves/{id}/points', answer<CurveDto>()),
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
  /** AUC NEXT: the auctions the Treasuries plan, still to come, soonest first. */
  plannedAuctions: (query: AuctionQuery, signal?: AbortSignal) =>
    // One route of the API answers both: with status=planned, the planned auctions alone.
    send(bondsRoutes.auctions, {
      query: { ...query, status: 'planned' },
      signal,
    }) as Promise<unknown> as Promise<PlannedAuctionDto[]>,
  /** AUC's indicators of a year. */
  auctionSummary: (query: AuctionSummaryQuery, signal?: AbortSignal) =>
    send(bondsRoutes.auctionSummary, { query: { ...query }, signal }),
  /** A tenor's monthly average rate by state over 24 months. */
  auctionRates: (query: AuctionRatesQuery, signal?: AbortSignal) =>
    send(bondsRoutes.auctionRates, { query: { ...query }, signal }),
  /** A result and its bids by rate. */
  auction: (id: string, signal?: AbortSignal) =>
    send(bondsRoutes.auction, { params: { id }, signal }),
  /** APE: the public bond issues. */
  publicOffers: (status: PublicOfferStatus | undefined, signal?: AbortSignal) =>
    send(bondsRoutes.publicOffers, { query: { status }, signal }),
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
  analyticsHistory: (id: string, query: BondHistoryQuery, signal?: AbortSignal) =>
    send(bondsRoutes.analyticsHistory, { params: { id }, query: { ...query }, signal }),
  /** The agencies' ratings in force, the composite and the ratings given (screen 20). */
  ratings: (id: string, signal?: AbortSignal) =>
    send(bondsRoutes.ratings, { params: { id }, signal }),
  /** The payments from today and the days to the next coupon (screen 20). */
  cashFlows: (id: string, signal?: AbortSignal) =>
    send(bondsRoutes.cashFlows, { params: { id }, signal }),
  /** BP's curves: CMarket's of the country, then the custom curves the user may use (ROADMAP decision 45). */
  curves: (query: CurveQuery, signal?: AbortSignal) =>
    send(bondsRoutes.curves, { query: { ...query }, signal }),
  /** A curve and its points by time: "cmkt-CM" for CMarket's curve of Cameroon, else a custom curve's id. */
  curve: (id: string, date?: string, signal?: AbortSignal) =>
    send(bondsRoutes.curve, { params: { id }, query: { date }, signal }),
}
