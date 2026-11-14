import type {
  RfqAgreementStatus,
  RfqQuoteType,
  RfqRequestStatus,
  RfqResponseStatus,
  RfqSide,
} from '@/shared/api/contracts'
import { formatCompact, formatNumber, type Locale } from '@/shared/lib/format'
import type { BadgeTone } from '@/shared/ui/Badge'

/** A request's status as screen 22 colours it: open in blue, confirmed green, partly filled yellow. */
export const REQUEST_TONES: Readonly<Record<RfqRequestStatus, BadgeTone>> = {
  published: 'info',
  answersReceived: 'info',
  confirmed: 'up',
  partiallyFilled: 'warning',
  cancelled: 'neutral',
  expired: 'neutral',
}

/** An answer's: "SELECTED" green, "NOT SELECTED" grey, as the blotter of the mockup. */
export const RESPONSE_TONES: Readonly<Record<RfqResponseStatus, BadgeTone>> = {
  sent: 'info',
  improved: 'info',
  withdrawn: 'neutral',
  selected: 'up',
  partiallySelected: 'warning',
  notSelected: 'neutral',
  expired: 'neutral',
}

/** An agreement's: "AWAITING SVT" yellow, "CONCLUDED" green, rejected red. */
export const AGREEMENT_TONES: Readonly<Record<RfqAgreementStatus, BadgeTone>> = {
  awaitingSvt: 'warning',
  concluded: 'up',
  rejected: 'down',
  expired: 'neutral',
  cancelled: 'neutral',
}

/** Open: published, answered or not, and not past its confirmation's end. */
export function isRequestOpen(
  request: { status: RfqRequestStatus; expiresAt: string },
  now: number,
): boolean {
  return (
    (request.status === 'published' || request.status === 'answersReceived') &&
    now < Date.parse(request.expiresAt)
  )
}

/** The status as of `now`: an open request past its confirmation's end has expired. */
export function requestStatusAt(
  request: { status: RfqRequestStatus; expiresAt: string },
  now: number,
): RfqRequestStatus {
  const open = request.status === 'published' || request.status === 'answersReceived'
  return open && now >= Date.parse(request.expiresAt) ? 'expired' : request.status
}

/** The responders' side: a buyer's answers sell, a seller's buy. */
export function answerSide(requestSide: RfqSide): RfqSide {
  return requestSide === 'buy' ? 'sell' : 'buy'
}

/** The value quoted in a quote type: the clean price, or the rate or yield. */
export function quotedValue(quoteType: RfqQuoteType, quote: { price: number; ratePct: number }) {
  return quoteType === 'price' ? quote.price : quote.ratePct
}

/**
 * A price or a rate as entered, to the ten-thousandth: two decimals at least, more only when they
 * count ("100.20", "100.205", "97.0797").
 */
export function formatQuote(value: number, locale: Locale): string {
  return formatNumber(Math.round(value * 10_000) / 10_000, locale, quoteDecimals(value))
}

/** The decimals a quote is shown with: two at least, as many as it has up to four. */
export function quoteDecimals(value: number | null): number {
  if (value === null) return 2
  const rounded = Math.round(value * 10_000) / 10_000
  return Number.isInteger(rounded * 100) ? 2 : Number.isInteger(rounded * 1_000) ? 3 : 4
}

/** A face amount as screen 22 writes it: "500 M", "1 Bn", "1.5 Bn"; a decimal only when needed. */
export function formatFace(amount: number, locale: Locale): string {
  const unit = amount >= 1e9 ? 1e9 : amount >= 1e6 ? 1e6 : 1e3
  return formatCompact(amount, locale, Number.isInteger(amount / unit) ? 0 : 1)
}

/** Time left as the countdown of screen 22: "02:51", with the hours past an hour; 00:00 once over. */
export function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const pad = (value: number) => String(value).padStart(2, '0')
  const [hours, minutes] = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60)]
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}`
    : `${pad(minutes)}:${pad(seconds % 60)}`
}

/** The short number of a request or an agreement: "RFQ-0042" for "RFQ-261029-0042". */
export function shortNumber(number: string): string {
  const parts = number.split('-')
  return parts.length === 3 ? `${parts[0]}-${parts[2]}` : number
}
