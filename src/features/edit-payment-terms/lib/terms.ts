import type { SourcePaymentTermsDto, SourcePaymentSettingsWriteDto } from '@/shared/api/contracts'

export interface TermsForm {
  ratePerClick: number | null
  monthlyCap: number | null
  noCap: boolean
  effectiveFrom: string
}

/** The form of a newspaper's terms in force, from this month by default (spec: "current month by default"). */
export const termsForm = (terms: SourcePaymentTermsDto): TermsForm => ({
  ratePerClick: terms.ratePerClick,
  monthlyCap: terms.monthlyCap,
  noCap: terms.monthlyCap === null,
  effectiveFrom: terms.month,
})

/**
 * What the form lacks, by field: a positive whole rate per click, a positive whole cap unless
 * "No cap" (spec, screen 18, "Payment settings").
 */
export function termsErrors(form: TermsForm): { ratePerClick: boolean; monthlyCap: boolean } {
  const whole = (value: number | null) => value !== null && Number.isInteger(value) && value >= 1
  return {
    ratePerClick: !whole(form.ratePerClick),
    monthlyCap: !form.noCap && !whole(form.monthlyCap),
  }
}

export const termsBody = (form: TermsForm): SourcePaymentSettingsWriteDto => ({
  ratePerClick: form.ratePerClick ?? 0,
  monthlyCap: form.noCap ? null : form.monthlyCap,
  effectiveFrom: form.effectiveFrom,
})
