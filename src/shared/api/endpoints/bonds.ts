import type {
  AuctionDto,
  AuctionInstrument,
  BondCalculationDto,
  BondCalculationRequestDto,
  BondDto,
  BondSummaryDto,
  YieldCurveDto,
} from '../contracts'
import { answer, route, send } from './define'

export interface AuctionQuery {
  country?: string
  instrument?: AuctionInstrument
}

export interface YieldCurveQuery {
  /** The latest session when absent. */
  date?: string
  /** Every CEMAC country when absent. */
  country?: string
}

/** CMarket.Api/Controllers/Bonds: listed bonds, the calculator, the BEAC auctions, the curves. */
export const bondsRoutes = {
  list: route('GET', '/bonds', answer<BondSummaryDto[]>()),
  bond: route('GET', '/bonds/{id}', answer<BondDto>()),
  calculate: route('POST', '/bonds/{id}/calculate', answer<BondCalculationDto>()),
  auctions: route('GET', '/auctions', answer<AuctionDto[]>()),
  yieldCurves: route('GET', '/yield-curves', answer<YieldCurveDto[]>()),
}

export const bondsApi = {
  /** Listed bonds and government securities. */
  list: (signal?: AbortSignal) => send(bondsRoutes.list, { signal }),
  /** Terms and cash-flow schedule. */
  bond: (id: string, signal?: AbortSignal) => send(bondsRoutes.bond, { params: { id }, signal }),
  /** The calculator (spec section 14.1): reads data, changes nothing. */
  calculate: (id: string, request: BondCalculationRequestDto, signal?: AbortSignal) =>
    send(bondsRoutes.calculate, { params: { id }, body: request, signal }),
  /** BEAC auction results, newest first. */
  auctions: (query: AuctionQuery, signal?: AbortSignal) =>
    send(bondsRoutes.auctions, { query: { ...query }, signal }),
  /** One curve per country, shortest maturity first. */
  yieldCurves: (query: YieldCurveQuery, signal?: AbortSignal) =>
    send(bondsRoutes.yieldCurves, { query: { ...query }, signal }),
}
