import type { PublicOfferDto, PublicOfferInput } from '@/shared/api/contracts'

/** The form of an issue: what CORR types, numbers null while empty. */
export interface OfferForm {
  issuer: string
  issuerKind: 'sovereign' | 'company'
  country: string
  amountSought: number | null
  couponPct: number | null
  maturityDate: string | null
  subscriptionStart: string | null
  subscriptionEnd: string | null
  arranger: string
  amountRaised: number | null
  withdrawn: boolean
}

export function offerForm(offer: PublicOfferDto | null): OfferForm {
  return offer
    ? {
        issuer: offer.issuer,
        issuerKind: offer.issuerKind,
        country: offer.country,
        amountSought: offer.amountSought,
        couponPct: offer.couponPct,
        maturityDate: offer.maturityDate,
        subscriptionStart: offer.subscriptionStart,
        subscriptionEnd: offer.subscriptionEnd,
        arranger: offer.arranger,
        amountRaised: offer.amountRaised,
        withdrawn: offer.status === 'withdrawn',
      }
    : {
        issuer: '',
        issuerKind: 'sovereign',
        country: 'CM',
        amountSought: null,
        couponPct: null,
        maturityDate: null,
        subscriptionStart: null,
        subscriptionEnd: null,
        arranger: '',
        amountRaised: null,
        withdrawn: false,
      }
}

/** The fields still empty, to say "Required" under each; none, the input the API takes. */
export function offerInput(form: OfferForm): {
  missing: (keyof OfferForm)[]
  input: PublicOfferInput | null
} {
  const missing = (
    [
      'issuer',
      'arranger',
      'amountSought',
      'couponPct',
      'maturityDate',
      'subscriptionStart',
      'subscriptionEnd',
    ] as const
  ).filter((key) => {
    const value = form[key]
    return value === null || (typeof value === 'string' && value.trim() === '')
  })
  if (missing.length > 0) return { missing, input: null }
  return {
    missing,
    input: {
      issuer: form.issuer.trim(),
      issuerKind: form.issuerKind,
      country: form.country,
      amountSought: form.amountSought!,
      couponPct: form.couponPct!,
      maturityDate: form.maturityDate!,
      subscriptionStart: form.subscriptionStart!,
      subscriptionEnd: form.subscriptionEnd!,
      arranger: form.arranger.trim(),
      amountRaised: form.amountRaised,
      withdrawn: form.withdrawn,
    },
  }
}
