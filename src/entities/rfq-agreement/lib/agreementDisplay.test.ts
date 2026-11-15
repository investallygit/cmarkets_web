import { describe, expect, it } from 'vitest'
import type { RfqAgreementRecipientDto } from '@/shared/api/contracts'
import { oneSvt, recipientLabelKey, recipientName } from './agreementDisplay'

const bankD = { id: 'd', name: 'Bank D' }
const bankE = { id: 'e', name: 'Bank E' }
const twoSvts = { buyerSvt: bankD, sellerSvt: bankE }
const sameSvt = { buyerSvt: bankE, sellerSvt: bankE }

const recipient = (kind: RfqAgreementRecipientDto['kind'], name: string) => ({
  kind,
  name,
  emails: [],
})

describe("an agreement's recipients (screen 23)", () => {
  it('names a back office by its role, one SVT on both legs as such', () => {
    expect(oneSvt(twoSvts)).toBe(false)
    expect(oneSvt(sameSvt)).toBe(true)
    expect(recipientLabelKey('requester', twoSvts)).toBe('rfqAgreements.detail.recipient.requester')
    expect(recipientLabelKey('buyerSvt', twoSvts)).toBe('rfqAgreements.detail.recipient.buyerSvt')
    expect(recipientLabelKey('buyerSvt', sameSvt)).toBe('rfqAgreements.detail.recipient.bothSvt')
    expect(recipientLabelKey('sellerSvt', twoSvts)).toBe('rfqAgreements.detail.recipient.sellerSvt')
  })

  it('shows a trader by name and a back office by its bank', () => {
    expect(recipientName(recipient('responder', 'T. Bekale'), twoSvts)).toBe('T. Bekale')
    expect(recipientName(recipient('buyerSvt', 'Back office titres Bank D'), twoSvts)).toBe(
      'Bank D',
    )
    expect(recipientName(recipient('sellerSvt', 'Back office titres Bank E'), twoSvts)).toBe(
      'Bank E',
    )
  })
})
