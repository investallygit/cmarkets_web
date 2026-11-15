import type {
  AgreementRecipient,
  DailyLimitInput,
  DailyReportDto,
  DailyReportMonthDto,
  MySvtsDto,
  RfqAgreementCriteria,
  RfqAgreementDetailsDto,
  RfqAgreementFilterDto,
  RfqAgreementFilterInput,
  RfqAgreementOptionsDto,
  RfqAgreementPageDto,
  RfqAllocationDto,
  RfqAnswerInput,
  RfqBlotterDto,
  RfqBoardDto,
  RfqCancelAgreementInput,
  RfqConfirmInput,
  RfqMyResponseDto,
  RfqPricingDto,
  RfqPublishInput,
  RfqQuoteType,
  RfqRequestDto,
  RfqRequestSummaryDto,
  RfqSetupDto,
  RfqSide,
  RfqTicketResendDto,
  RejectAgreementInput,
  SvtApprovalDetailDto,
  SvtApprovalItemDto,
  SvtLinkDto,
  SvtLinkRequestInput,
  SvtLinksDto,
  SvtSettingsDto,
  SvtSettingsInput,
  SvtSummaryDto,
  TraderLinkDto,
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

/** GET /rfq/board's filters. */
export interface RfqBoardQuery {
  type?: 'BTA' | 'OTA'
  side?: RfqSide
  /** The issuing state's code. */
  country?: string
}

/** GET /rfq/agreements: the filters, the order ('-' for descending) and the page. */
export interface RfqAgreementQuery extends RfqAgreementCriteria {
  sort?: string
  page?: number
  pageSize?: number
}

/** GET /rfq/mine and /rfq/blotter: the trader's own, or its organisation's (its CEO's view). */
export type RfqScope = 'mine' | 'organization'

/** GET /svt/approvals: waiting by time left, or decided between two days of Douala (today by default). */
export type SvtApprovalsQuery =
  { status: 'pending' } | { status: 'decided'; from?: string; to?: string }

/**
 * CMarket.Api/Controllers/Rfq: the traders' links to the SVTs (ROADMAP step 43), "My SVTs" of a
 * Trader or a Manager (screen 22), the bank's trader links for its SVT accounts (TRD); the
 * trading of screen 22 (step 44): the requests, the board, the answers, the selection, the
 * blotter; the SVT's approvals and settings (screen 27, step 45); the agreements of screen 23
 * (step 46): the list, its export, an agreement, its ticket and its resending, its
 * cancellation, the saved filters.
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
  svtSummary: route('GET', '/svt/summary', answer<SvtSummaryDto>()),
  svtApprovals: route('GET', '/svt/approvals', answer<SvtApprovalItemDto[]>()),
  svtApproval: route('GET', '/svt/approvals/{agreementId}', answer<SvtApprovalDetailDto>()),
  approveAgreement: route(
    'POST',
    '/svt/approvals/{agreementId}/approve',
    answer<SvtApprovalDetailDto>(),
  ),
  rejectAgreement: route(
    'POST',
    '/svt/approvals/{agreementId}/reject',
    answer<SvtApprovalDetailDto>(),
  ),
  svtSettings: route('GET', '/svt/settings', answer<SvtSettingsDto>()),
  saveSvtSettings: route('PUT', '/svt/settings', answer<SvtSettingsDto>()),
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
  // RFQ REP, the daily reporting to the BEAC (screen 24, ROADMAP step 47): the Admin's.
  dailyReports: route('GET', '/rfq/daily-reports', answer<DailyReportMonthDto>()),
  dailyReport: route('GET', '/rfq/daily-reports/{date}', answer<DailyReportDto>()),
  dailyReportSummary: route('GET', '/rfq/daily-reports/{date}/summary.pdf', answer<Blob>()),
  dailyReportTransactions: route(
    'GET',
    '/rfq/daily-reports/{date}/transactions.xlsx',
    answer<Blob>(),
  ),
  sendDailyReport: route('POST', '/rfq/daily-reports/{date}/send', answer<DailyReportDto>()),
  // RFQ AGR, the agreements (screen 23, ROADMAP step 46): a party's, an SVT's, the Admin's.
  agreements: route('GET', '/rfq/agreements', answer<RfqAgreementPageDto>()),
  agreementOptions: route('GET', '/rfq/agreements/options', answer<RfqAgreementOptionsDto>()),
  exportAgreements: route('GET', '/rfq/agreements/export', answer<Blob>()),
  agreement: route('GET', '/rfq/agreements/{id}', answer<RfqAgreementDetailsDto>()),
  agreementTicket: route('GET', '/rfq/agreements/{id}/ticket.pdf', answer<Blob>()),
  resendTicket: route('POST', '/rfq/agreements/{id}/resend', answer<RfqTicketResendDto>()),
  cancelAgreement: route('POST', '/rfq/agreements/{id}/cancel', answer<RfqAgreementDetailsDto>()),
  agreementFilters: route('GET', '/rfq/agreement-filters', answer<RfqAgreementFilterDto[]>()),
  saveAgreementFilter: route('POST', '/rfq/agreement-filters', answer<RfqAgreementFilterDto>()),
  deleteAgreementFilter: route('DELETE', '/rfq/agreement-filters/{id}'),
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
  /** Screen 27's counters, with the Admin's window. */
  svtSummary: (signal?: AbortSignal) => send(rfqRoutes.svtSummary, { signal }),
  /** The bank's approvals waiting, by time left with their checks; or decided, newest first. */
  svtApprovals: (query: SvtApprovalsQuery, signal?: AbortSignal) =>
    send(rfqRoutes.svtApprovals, { query: { ...query }, signal }),
  /** An agreement naming the bank, both approvals, what the reader may do. */
  svtApproval: (agreementId: string, signal?: AbortSignal) =>
    send(rfqRoutes.svtApproval, { params: { agreementId }, signal }),
  /** Approves the bank's leg; above its four-eyes threshold, another approver completes it. */
  approveAgreement: (agreementId: string) =>
    send(rfqRoutes.approveAgreement, { params: { agreementId } }),
  /** Rejects the agreement with its reason, passed to both traders. */
  rejectAgreement: (agreementId: string, input: RejectAgreementInput) =>
    send(rfqRoutes.rejectAgreement, { params: { agreementId }, body: input }),
  svtSettings: (signal?: AbortSignal) => send(rfqRoutes.svtSettings, { signal }),
  saveSvtSettings: (input: SvtSettingsInput) => send(rfqRoutes.saveSvtSettings, { body: input }),
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
  /** The month's business days (yyyy-MM), newest first, with each one's send. */
  dailyReports: (month: string, signal?: AbortSignal) =>
    send(rfqRoutes.dailyReports, { query: { month }, signal }),
  /** A day's figures and send panel; a day not made yet, a preview of its figures so far. */
  dailyReport: (date: string, signal?: AbortSignal) =>
    send(rfqRoutes.dailyReport, { params: { date }, signal }),
  /** The one-page PDF summary, as sent (or the preview of a day not made yet). */
  dailyReportSummary: (date: string, signal?: AbortSignal) =>
    sendBlob(rfqRoutes.dailyReportSummary, { params: { date }, signal }),
  /** The Excel list of the day's agreements, as sent. */
  dailyReportTransactions: (date: string, signal?: AbortSignal) =>
    sendBlob(rfqRoutes.dailyReportTransactions, { params: { date }, signal }),
  /** Send now (a day not made yet, up to now) or Resend (the same files). */
  sendDailyReport: (date: string) => send(rfqRoutes.sendDailyReport, { params: { date } }),
  /** The agreements the reader reads (its organisation's, its bank's, all), filtered and paged. */
  agreements: (query: RfqAgreementQuery, signal?: AbortSignal) =>
    send(rfqRoutes.agreements, { query: { ...query }, signal }),
  agreementOptions: (signal?: AbortSignal) => send(rfqRoutes.agreementOptions, { signal }),
  /** Every agreement the filters keep, in the list's order, as XLSX or CSV. */
  exportAgreements: (query: RfqAgreementQuery, format: 'xlsx' | 'csv') =>
    sendBlob(rfqRoutes.exportAgreements, { query: { ...query, format } }),
  agreement: (id: string, signal?: AbortSignal) =>
    send(rfqRoutes.agreement, { params: { id }, signal }),
  /** The ticket as stored at the conclusion: the same PDF for every reader, every time. */
  agreementTicket: (id: string) => sendBlob(rfqRoutes.agreementTicket, { params: { id } }),
  /** The ticket again, as the same document, to its four recipients or to one. */
  resendTicket: (id: string, recipient: AgreementRecipient | null) =>
    send(rfqRoutes.resendTicket, { params: { id }, body: recipient ? { recipient } : {} }),
  /** Cancels a concluded agreement on both parties' letters: 409 for one not concluded. */
  cancelAgreement: (id: string, input: RfqCancelAgreementInput) => {
    const form = new FormData()
    form.append('reason', input.reason)
    form.append('requesterLetter', input.requesterLetter)
    form.append('responderLetter', input.responderLetter)
    return sendForm(rfqRoutes.cancelAgreement, form, { params: { id } })
  },
  agreementFilters: (signal?: AbortSignal) => send(rfqRoutes.agreementFilters, { signal }),
  saveAgreementFilter: (input: RfqAgreementFilterInput) =>
    send(rfqRoutes.saveAgreementFilter, { body: input }),
  deleteAgreementFilter: (id: string) => send(rfqRoutes.deleteAgreementFilter, { params: { id } }),
}
