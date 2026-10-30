import { describe, expect, it } from 'vitest'
import { createInvoices, createSubscriptions, PLANS } from '../fixtures/billing'
import {
  invoiceNumber,
  isExpired,
  planInvoice,
  publicationInvoice,
  renewed,
  type StoredSubscription,
} from './billing'

const professional = PLANS.find((plan) => plan.id === 'professional')!

const monthly: StoredSubscription = {
  id: 'subscription-test',
  payer: { type: 'user', id: 'user-test' },
  planId: 'professional',
  status: 'active',
  billingCycle: 'monthly',
  periodStart: '2026-08-15',
  periodEnd: '2026-09-15',
  method: 'card',
}

describe('subscriptions', () => {
  it('renews a paid plan period after period, not a trial', () => {
    expect(renewed(monthly, '2026-10-30')).toMatchObject({
      periodStart: '2026-10-15',
      periodEnd: '2026-11-15',
    })
    const trial = { ...monthly, status: 'trial' as const, billingCycle: null }
    expect(renewed(trial, '2026-10-30')).toBe(trial)
    expect(isExpired(trial, '2026-09-15')).toBe(true)
    expect(isExpired(trial, '2026-09-14')).toBe(false)
    expect(isExpired(monthly, '2027-01-01')).toBe(false)
  })

  it('dates the demo plans from today', () => {
    const subscriptions = createSubscriptions('2026-10-30')
    const byId = Object.fromEntries(subscriptions.map((item) => [item.id, item]))
    expect(byId['subscription-analyst']).toMatchObject({
      periodStart: '2026-01-15',
      periodEnd: '2027-01-15',
    })
    expect(byId['subscription-am']).toMatchObject({
      periodStart: '2026-10-01',
      periodEnd: '2026-11-01',
    })
    // Bank C has no Portfolio module: PORT is locked for T. Bekale.
    expect(byId['subscription-bank'].planId).toBe('analysis')
  })
})

describe('invoices', () => {
  it('numbers the invoices within the year', () => {
    expect(invoiceNumber([], '2026-10-30T10:00:00Z')).toBe('CM-2026-000101')
    const issued = planInvoice({
      id: 'invoice-1',
      number: 'CM-2026-000101',
      payer: monthly.payer,
      plan: professional,
      cycle: 'monthly',
      periodStart: '2026-10-30',
      seats: 1,
      method: 'card',
      issuedAt: '2026-10-30T10:00:00Z',
      paidAt: '2026-10-30T10:00:00Z',
    })
    expect(invoiceNumber([issued], '2026-12-01T10:00:00Z')).toBe('CM-2026-000102')
    expect(invoiceNumber([issued], '2027-01-02T10:00:00Z')).toBe('CM-2027-000101')
  })

  it('asks a transfer within 15 days, with the bank details and the reference', () => {
    const invoice = planInvoice({
      id: 'invoice-2',
      number: 'CM-2026-000102',
      payer: { type: 'organization', id: 'org-am' },
      plan: professional,
      cycle: 'yearly',
      periodStart: '2026-10-30',
      seats: 3,
      method: 'transfer',
      issuedAt: '2026-10-30T10:00:00Z',
      paidAt: null,
    })
    expect(invoice).toMatchObject({
      status: 'due',
      dueOn: '2026-11-14',
      periodEnd: '2027-10-29',
      amount: 2_100_000,
      taxAmount: 404_250,
      total: 2_504_250,
    })
    expect(invoice.transfer?.reference).toBe('CM-2026-000102')
  })

  it('gives a receipt of research bought, VAT included', () => {
    expect(
      publicationInvoice({
        id: 'invoice-3',
        number: 'CM-2026-000103',
        userId: 'user-manager',
        title: 'SEMC: volume growth supports the dividend',
        total: 15_000,
        taxRatePct: 19.25,
        method: 'mobileMoney',
        paidAt: '2026-10-30T10:00:00Z',
      }),
    ).toMatchObject({ kind: 'publication', amount: 12_579, total: 15_000, status: 'paid' })
  })

  it('bills the demo organisations per member, a recent transfer still due', () => {
    const today = '2026-10-05'
    const subscriptions = createSubscriptions(today)
    const invoices = createInvoices(today, subscriptions, (payer) =>
      payer.type === 'user' ? 1 : 3,
    )
    const am = invoices.filter((invoice) => invoice.payer.id === 'org-am')
    expect(am.map((invoice) => invoice.periodStart)).toEqual([
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
    ])
    expect(am.map((invoice) => invoice.status)).toEqual(['paid', 'paid', 'due'])
    expect(am[0].total).toBe(250_425)
    expect(invoices.filter((invoice) => invoice.payer.id === 'user-analyst')).toHaveLength(2)
    expect(new Set(invoices.map((invoice) => invoice.number)).size).toBe(invoices.length)
  })
})
