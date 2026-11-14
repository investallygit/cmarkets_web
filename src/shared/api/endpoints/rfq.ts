import type {
  DailyLimitInput,
  MySvtsDto,
  SvtLinkDto,
  SvtLinkRequestInput,
  SvtLinksDto,
  TraderLinkDto,
} from '../contracts'
import { answer, route, send } from './define'

/**
 * CMarket.Api/Controllers/Rfq: the traders' links to the SVTs (ROADMAP step 43), "My SVTs" of a
 * Trader or a Manager (screen 22), the bank's trader links for its SVT accounts (TRD).
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
}
