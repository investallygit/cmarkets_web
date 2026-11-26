import { describe, expect, it } from 'vitest'
import { offerForm, offerInput } from './offerForm'

describe('the form of a public bond issue (CORR, APE)', () => {
  it('lists the fields still empty', () => {
    expect(offerInput(offerForm(null)).missing).toEqual([
      'issuer',
      'arranger',
      'amountSought',
      'couponPct',
      'maturityDate',
      'subscriptionStart',
      'subscriptionEnd',
    ])
  })

  it('gives the input once complete, the names trimmed', () => {
    const form = {
      ...offerForm(null),
      issuer: ' Republic of Cameroon ',
      arranger: 'SCB Cameroun',
      amountSought: 200_000,
      couponPct: 6.75,
      maturityDate: '2031-12-01',
      subscriptionStart: '2026-11-01',
      subscriptionEnd: '2026-11-30',
    }
    expect(offerInput(form).input).toMatchObject({
      issuer: 'Republic of Cameroon',
      country: 'CM',
      amountRaised: null,
      withdrawn: false,
    })
  })
})
