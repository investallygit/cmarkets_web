import { describe, expect, it } from 'vitest'
import { termsBody, termsErrors, termsForm } from './terms'

const terms = {
  sourceId: 's1',
  month: '2026-11',
  ratePerClick: 15,
  monthlyCap: 400_000,
  version: null,
  upcoming: [],
  currency: 'XAF',
}

describe('payment terms form', () => {
  it('starts from the terms in force, from this month', () => {
    expect(termsForm(terms)).toEqual({
      ratePerClick: 15,
      monthlyCap: 400_000,
      noCap: false,
      effectiveFrom: '2026-11',
    })
    expect(termsForm({ ...terms, monthlyCap: null }).noCap).toBe(true)
  })

  it('asks a positive whole rate, and a cap unless none', () => {
    const form = termsForm(terms)
    expect(termsErrors(form)).toEqual({ ratePerClick: false, monthlyCap: false })
    expect(termsErrors({ ...form, ratePerClick: 12.5 }).ratePerClick).toBe(true)
    expect(termsErrors({ ...form, ratePerClick: 0 }).ratePerClick).toBe(true)
    expect(termsErrors({ ...form, monthlyCap: null }).monthlyCap).toBe(true)
    expect(termsErrors({ ...form, monthlyCap: null, noCap: true }).monthlyCap).toBe(false)
  })

  it('sends no cap as null', () => {
    expect(termsBody({ ...termsForm(terms), noCap: true })).toEqual({
      ratePerClick: 15,
      monthlyCap: null,
      effectiveFrom: '2026-11',
    })
  })
})
