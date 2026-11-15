import type {
  AgreementRecipient,
  RfqAgreementRecipientDto,
  RfqAgreementRowDto,
} from '@/shared/api/contracts'

type Svts = Pick<RfqAgreementRowDto, 'buyerSvt' | 'sellerSvt'>

/** Both sides chose the same SVT: one approval for both legs, one back office to e-mail. */
export function oneSvt(agreement: Svts): boolean {
  return agreement.buyerSvt.id === agreement.sellerSvt.id
}

export type RecipientLabelKey =
  | 'rfqAgreements.detail.recipient.requester'
  | 'rfqAgreements.detail.recipient.responder'
  | 'rfqAgreements.detail.recipient.buyerSvt'
  | 'rfqAgreements.detail.recipient.sellerSvt'
  | 'rfqAgreements.detail.recipient.bothSvt'

/**
 * How screen 23 names a recipient (its e-mail log, the resend's choice): its role, then the trader
 * or the back office's bank; the back office of an SVT holding both legs, as such.
 */
export function recipientLabelKey(kind: AgreementRecipient, agreement: Svts): RecipientLabelKey {
  if (kind === 'buyerSvt' && oneSvt(agreement)) return 'rfqAgreements.detail.recipient.bothSvt'
  return `rfqAgreements.detail.recipient.${kind}`
}

/**
 * The name the label shows: the trader's; for a back office, its SVT's bank (the log keeps the
 * name its e-mail went under, "Back office titres Bank D").
 */
export function recipientName(recipient: RfqAgreementRecipientDto, agreement: Svts): string {
  if (recipient.kind === 'buyerSvt') return agreement.buyerSvt.name
  if (recipient.kind === 'sellerSvt') return agreement.sellerSvt.name
  return recipient.name
}
