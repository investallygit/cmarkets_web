import { describe, expect, it } from 'vitest'
import type { BondDto, MarketYieldDto } from '@/shared/api/contracts'
import {
  formOf,
  hasChanged,
  nextRepayment,
  rangeErrors,
  redemptionsOf,
  scheduleAddsUp,
  scheduleRequest,
  toRequest,
  type PricingForm,
} from './pricingForm'

/** ECMR 6.25% 2029 of the demo, a fifth of its face repaid each November (case B of 14.1). */
const ECMR: BondDto = {
  id: 'ECMR-6.25-2029',
  code: 'ECMR 6.25% 29',
  name: 'Republic of Cameroon 6.25% 2024-2029',
  issuer: 'Republic of Cameroon',
  country: 'CM',
  currency: 'XAF',
  couponPct: 6.25,
  frequency: 1,
  issueDate: '2024-11-04',
  maturityDate: '2029-11-04',
  amortization: 'straight',
  dayCount: 'ACT/ACT ICMA',
  nominal: 10_000,
  amountOutstanding: 160_000_000_000,
  isin: 'CM0000020010',
  issuerCategory: 'sovereign',
  sector: null,
  market: 'bvmac',
  seniority: 'seniorUnsecured',
  couponType: 'fixed',
  floatIndex: null,
  floatMarginPct: null,
  firstCouponDate: null,
  status: 'performing',
  calls: [],
  puts: [],
  schedule: [2025, 2026, 2027, 2028, 2029].map((year, index) => ({
    date: `${year}-11-04`,
    coupon: (100 - 20 * index) * 0.0625,
    amortization: 20,
    outstanding: 80 - 20 * index,
  })),
}

const MARKET: MarketYieldDto = {
  bondId: ECMR.id,
  date: '2026-10-28',
  settlementDate: '2026-10-30',
  settlementSessions: 2,
  ytmPct: 5.241_912,
  source: 'bs',
  asOf: '2026-10-29',
  priceSource: 'quote',
  curveYieldPct: null,
  spreadBp: null,
}

/** Case A of section 14.1, entered by hand. */
const CASE_A: PricingForm = {
  ...formOf(ECMR, MARKET),
  bondId: null,
  redemption: 'bullet',
  schedule: [],
  ytm: 5.7302,
}

describe('the inputs of bond pricing (spec screen 16)', () => {
  it('fills a bond of the list with its terms, its market yield and settlement', () => {
    const form = formOf(ECMR, MARKET)

    expect(form).toMatchObject({
      bondId: ECMR.id,
      currency: 'XAF',
      faceValue: 100,
      couponRate: 6.25,
      frequency: 1,
      maturityDate: '2029-11-04',
      settlementDate: '2026-10-30',
      dayCount: 'ACT/ACT ICMA',
      redemption: 'amortizing',
      ytm: 5.241_912,
      faceAmount: 100_000_000,
    })
    expect(form.schedule).toHaveLength(5)
    expect(redemptionsOf({ ...ECMR, amortization: 'bullet' })).toEqual([])
  })

  it('sends a bond of the list by its id, at the full yield', () => {
    expect(toRequest(formOf(ECMR, MARKET))).toEqual({
      bondId: ECMR.id,
      settlementDate: '2026-10-30',
      ytm: 5.241_912,
      faceAmount: 100_000_000,
    })
  })

  it('sends the characteristics of a bond entered by hand, its schedule when it amortizes', () => {
    expect(toRequest(CASE_A)).toEqual({
      faceValue: 100,
      couponRate: 6.25,
      frequency: 1,
      maturityDate: '2029-11-04',
      settlementDate: '2026-10-30',
      dayCount: 'ACT/ACT ICMA',
      ytm: 5.7302,
      faceAmount: 100_000_000,
    })
    const amortizing = { ...formOf(ECMR, MARKET), bondId: null }
    expect(toRequest(amortizing)?.redemptionSchedule).toEqual(
      [2025, 2026, 2027, 2028, 2029].map((year) => ({ date: `${year}-11-04`, pct: 20 })),
    )
  })

  it('sends nothing while an input is missing, out of range or the shares do not add up', () => {
    expect(toRequest({ ...CASE_A, ytm: null })).toBeNull()
    expect(toRequest({ ...CASE_A, ytm: 100 })).toBeNull()
    expect(toRequest({ ...CASE_A, settlementDate: null })).toBeNull()
    expect(toRequest({ ...CASE_A, faceAmount: 0 })).toBeNull()
    expect(toRequest({ ...CASE_A, maturityDate: null })).toBeNull()
    expect(toRequest({ ...CASE_A, faceValue: 0 })).toBeNull()
    const short = [{ date: '2029-11-04', pct: 90 }]
    expect(scheduleAddsUp(short)).toBe(false)
    expect(toRequest({ ...CASE_A, redemption: 'amortizing', schedule: short })).toBeNull()
    expect(toRequest({ ...CASE_A, redemption: 'amortizing', schedule: [] })).toBeNull()
  })

  it('names each input typed out of range (B54)', () => {
    expect([...rangeErrors(CASE_A)]).toEqual([])
    expect([...rangeErrors({ ...CASE_A, couponRate: -1 })]).toEqual(['couponRate'])
    expect([...rangeErrors({ ...CASE_A, couponRate: 150 })]).toEqual(['couponRate'])
    expect([...rangeErrors({ ...CASE_A, faceValue: 0 })]).toEqual(['faceValue'])
    expect([...rangeErrors({ ...CASE_A, ytm: -80 })]).toEqual(['ytm'])
    expect(toRequest({ ...CASE_A, couponRate: 150 })).toBeNull()
    // A bond of the list keeps its own terms: only the yield is the user's.
    expect([...rangeErrors({ ...formOf(ECMR, MARKET), faceValue: 0 })]).toEqual([])
  })

  it('adds a repayment at maturity first, then a year after the last', () => {
    expect(nextRepayment(CASE_A)).toEqual({ date: '2029-11-04', pct: 100 })
    expect(nextRepayment({ ...CASE_A, schedule: [{ date: '2028-11-04', pct: 50 }] })).toEqual({
      date: '2029-11-04',
      pct: null,
    })
  })

  it('tells when the figures shown are of other inputs', () => {
    const form = formOf(ECMR, MARKET)
    const submitted = toRequest(form)

    expect(hasChanged(form, submitted)).toBe(false)
    expect(hasChanged({ ...form, ytm: 6 }, submitted)).toBe(true)
    expect(hasChanged({ ...form, bondId: null }, submitted)).toBe(true)
  })

  it('prices at a clean price, a curve or the rates entered in place of the yield', () => {
    const list = formOf(ECMR, MARKET)
    const byPrice = {
      ...CASE_A,
      discount: { ...CASE_A.discount, byPrice: true, cleanPrice: 101.4 },
    }
    const curve = { ...list, ytm: null, discount: { ...list.discount, mode: 'curve' as const } }
    const rates = {
      ...list,
      discount: { ...list.discount, mode: 'rates' as const, rates: { '2026-11-04': 4.8 } },
    }

    expect(toRequest(byPrice)).toMatchObject({ cleanPrice: 101.4 })
    expect(toRequest(byPrice)).not.toHaveProperty('ytm')
    // The yield is not block B's in curve mode: none needed, none sent.
    expect(toRequest(curve)).toEqual({
      bondId: ECMR.id,
      settlementDate: '2026-10-30',
      discount: { mode: 'curve', curveId: 'cmkt-CM' },
      faceAmount: 100_000_000,
    })
    expect(toRequest(rates, ['2026-11-04'])?.discount).toEqual({
      mode: 'rates',
      rates: [{ date: '2026-11-04', ratePct: 4.8 }],
    })
    expect(toRequest(rates, ['2026-11-04', '2027-11-04'])).toBeNull()
  })

  it('names a clean price or a rate out of range, and reads the dates at any yield', () => {
    const byPrice = { ...CASE_A, discount: { ...CASE_A.discount, byPrice: true, cleanPrice: 0 } }
    const rates = {
      ...CASE_A,
      ytm: 500,
      discount: { ...CASE_A.discount, mode: 'rates' as const, rates: { '2026-11-04': -6 } },
    }

    expect([...rangeErrors(byPrice)]).toEqual(['cleanPrice'])
    expect([...rangeErrors(rates)]).toEqual(['rates'])
    expect(scheduleRequest(rates)).toMatchObject({ ytm: 5, maturityDate: '2029-11-04' })
    expect(scheduleRequest({ ...CASE_A, faceAmount: 0 })).toEqual(toRequest({ ...CASE_A, ytm: 5 }))
  })
})
