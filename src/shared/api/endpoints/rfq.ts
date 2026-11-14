import type {
  DailyLimitInput,
  MySvtsDto,
  RfqAllocationDto,
  RfqAnswerInput,
  RfqBlotterDto,
  RfqBoardDto,
  RfqConfirmInput,
  RfqMyResponseDto,
  RfqPricingDto,
  RfqPublishInput,
  RfqQuoteType,
  RfqRequestDto,
  RfqRequestSummaryDto,
  RfqSetupDto,
  RfqSide,
  SvtLinkDto,
  SvtLinkRequestInput,
  SvtLinksDto,
  TraderLinkDto,
} from '../contracts'
import { answer, route, send } from './define'

/** GET /rfq/board's filters. */
export interface RfqBoardQuery {
  type?: 'BTA' | 'OTA'
  side?: RfqSide
  /** The issuing state's code. */
  country?: string
}

/** GET /rfq/mine and /rfq/blotter: the trader's own, or its organisation's (its CEO's view). */
export type RfqScope = 'mine' | 'organization'

/**
 * CMarket.Api/Controllers/Rfq: the traders' links to the SVTs (ROADMAP step 43), "My SVTs" of a
 * Trader or a Manager (screen 22), the bank's trader links for its SVT accounts (TRD); the
 * trading of screen 22 (step 44): the requests, the board, the answers, the selection, the blotter.
 */
export const rfqRoutes = {
  mySvts: route('GET', '/me/svt', answer<MySvtsDto>()),
  requestSvt: route('POST', '/me/svt', answer<SvtLinkDto>()),
  removeSvt: route('DELETE', '/me/svt/{svtId}'),
  svtLinks: route('GET', '/svt/links', answer<SvtLinksDto>()),
  confirmLink: route('POST', '/svt/links/{linkId}/confirm', answer<TraderLinkDto>()),
  declineLink: route('POST', '/svt/links/{linkId}/decline', answer<TraderLinkDto>()),
  revokeLink: route('POST', '/svt/links/{linkId}/revoke', answer<TraderLinkDto>()),
  linkLimit: route('PUT', '/svt/links/{linkId}/limit', answer<TraderLinkDto>()),
  setup: route('GET', '/rfq/setup', answer<RfqSetupDto>()),
  pricing: route('GET', '/rfq/pricing', answer<RfqPricingDto>()),
  publish: route('POST', '/rfq', answer<RfqRequestDto>()),
  board: route('GET', '/rfq/board', answer<RfqBoardDto>()),
  mine: route('GET', '/rfq/mine', answer<RfqRequestSummaryDto[]>()),
  blotter: route('GET', '/rfq/blotter', answer<RfqBlotterDto>()),
  request: route('GET', '/rfq/{id}', answer<RfqRequestDto>()),
  allocation: route('GET', '/rfq/{id}/allocation', answer<RfqAllocationDto>()),
  confirm: route('POST', '/rfq/{id}/confirm', answer<RfqRequestDto>()),
  cancel: route('POST', '/rfq/{id}/cancel', answer<RfqRequestDto>()),
  answer: route('POST', '/rfq/{id}/responses', answer<RfqMyResponseDto>()),
  improve: route('PUT', '/rfq/{id}/responses/{responseId}', answer<RfqMyResponseDto>()),
  withdraw: route('DELETE', '/rfq/{id}/responses/{responseId}'),
}

export const rfqApi = {
  /** The trader's links, one per SVT with its status and date, and the licensed SVTs to ask. */
  mySvts: (signal?: AbortSignal) => send(rfqRoutes.mySvts, { signal }),
  /** Asks an SVT for a link: its bank's SVT accounts are told by e-mail and on TRD. */
  requestSvt: (input: SvtLinkRequestInput) => send(rfqRoutes.requestSvt, { body: input }),
  /** Removes the SVT: the link in force with it, confirmed or waiting, is withdrawn. */
  removeSvt: (svtId: string) => send(rfqRoutes.removeSvt, { params: { svtId } }),
  /** The bank's requests waiting, oldest first, then its linked traders. */
  svtLinks: (signal?: AbortSignal) => send(rfqRoutes.svtLinks, { signal }),
  confirmLink: (linkId: string, input: DailyLimitInput) =>
    send(rfqRoutes.confirmLink, { params: { linkId }, body: input }),
  declineLink: (linkId: string) => send(rfqRoutes.declineLink, { params: { linkId } }),
  revokeLink: (linkId: string) => send(rfqRoutes.revokeLink, { params: { linkId } }),
  changeLimit: (linkId: string, input: DailyLimitInput) =>
    send(rfqRoutes.linkLimit, { params: { linkId }, body: input }),
  /** The BTA and OTA traded, the settlement dates, the minimum amount, the confirmed SVTs. */
  setup: (signal?: AbortSignal) => send(rfqRoutes.setup, { signal }),
  /** The curve's reference and the latest auction; with a value, the other side of the quote. */
  pricing: (
    query: { securityId: string; settlementDate: string; quoteType?: RfqQuoteType; value?: number },
    signal?: AbortSignal,
  ) => send(rfqRoutes.pricing, { query: { ...query }, signal }),
  publish: (input: RfqPublishInput) => send(rfqRoutes.publish, { body: input }),
  board: (query: RfqBoardQuery = {}, signal?: AbortSignal) =>
    send(rfqRoutes.board, { query: { ...query }, signal }),
  mine: (scope: RfqScope, signal?: AbortSignal) =>
    send(rfqRoutes.mine, { query: { scope }, signal }),
  blotter: (scope: RfqScope, signal?: AbortSignal) =>
    send(rfqRoutes.blotter, { query: { scope }, signal }),
  request: (id: string, signal?: AbortSignal) =>
    send(rfqRoutes.request, { params: { id }, signal }),
  allocation: (id: string, signal?: AbortSignal) =>
    send(rfqRoutes.allocation, { params: { id }, signal }),
  /** Confirms the selection at the version shown: 409 "Selection changed" when it moved. */
  confirm: (id: string, input: RfqConfirmInput) =>
    send(rfqRoutes.confirm, { params: { id }, body: input }),
  cancel: (id: string) => send(rfqRoutes.cancel, { params: { id } }),
  answer: (id: string, input: RfqAnswerInput) =>
    send(rfqRoutes.answer, { params: { id }, body: input }),
  improve: (id: string, responseId: string, input: RfqAnswerInput) =>
    send(rfqRoutes.improve, { params: { id, responseId }, body: input }),
  withdraw: (id: string, responseId: string) =>
    send(rfqRoutes.withdraw, { params: { id, responseId } }),
}
