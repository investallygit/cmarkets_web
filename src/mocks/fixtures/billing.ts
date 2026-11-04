import type { ClientAccountType, IsoDate, PlanDto } from '@/shared/api/contracts'
import { addDays, addMonths } from '@/shared/lib/isoDate'
import {
  invoiceNumber,
  periodEndOf,
  planInvoice,
  type Payer,
  type StoredInvoice,
  type StoredSubscription,
} from '../lib/billing'

/** VAT in Cameroon, where CMarket invoices from. */
export const TAX_RATE_PCT = 19.25

const plan = (
  id: string,
  name: string,
  modules: PlanDto['modules'],
  monthlyPrice: number,
  accountTypes: ClientAccountType[],
): PlanDto => ({
  id,
  name,
  modules,
  monthlyPrice,
  // Two months free for a year.
  yearlyPrice: monthlyPrice * 10,
  currency: 'XAF',
  taxRatePct: TAX_RATE_PCT,
  accountTypes,
})

const PROFESSIONALS: ClientAccountType[] = ['analyst', 'manager', 'trader', 'journalist', 'ceo']

/** The plans of spec section 6, prices per user and month excluding VAT; the spec gives none. */
export const PLANS: PlanDto[] = [
  plan('monitoring', 'Monitoring', ['monitoring'], 25_000, PROFESSIONALS),
  plan('analysis', 'Analysis', ['monitoring', 'analysis'], 45_000, PROFESSIONALS),
  plan(
    'professional',
    'Professional',
    ['monitoring', 'analysis', 'portfolio'],
    70_000,
    PROFESSIONALS,
  ),
  plan('student', 'Student', ['monitoring', 'analysis', 'portfolio'], 5_000, ['student']),
]

/** The free trial gives every module the account type may subscribe to. */
export const trialPlanOf = (accountType: ClientAccountType) =>
  accountType === 'student' ? 'student' : 'professional'

/** The last anniversary (MM-DD) of a yearly plan, on or before today. */
function lastAnniversary(today: IsoDate, monthDay: string): IsoDate {
  const thisYear = `${today.slice(0, 4)}-${monthDay}`
  return thisYear <= today ? thisYear : addMonths(thisYear, -12)
}

/**
 * The demo plans, dated from today: K. Atangana pays Professional yearly by card and R. Tamba
 * Analysis monthly by card; Asset manager A pays Professional monthly and Bank C Analysis (no
 * Portfolio module) yearly, both by transfer; University B has the student plan for its students.
 */
export function createSubscriptions(today: IsoDate): StoredSubscription[] {
  const subscription = (
    id: string,
    payer: Payer,
    planId: string,
    periodStart: IsoDate,
    billingCycle: 'monthly' | 'yearly',
    method: 'card' | 'transfer',
  ): StoredSubscription => ({
    id,
    payer,
    planId,
    status: 'active',
    billingCycle,
    periodStart,
    periodEnd: periodEndOf(periodStart, billingCycle),
    method,
  })
  const organization = (id: string): Payer => ({ type: 'organization', id })
  return [
    subscription(
      'subscription-analyst',
      { type: 'user', id: 'user-analyst' },
      'professional',
      lastAnniversary(today, '01-15'),
      'yearly',
      'card',
    ),
    subscription(
      'subscription-journalist',
      { type: 'user', id: 'user-journalist' },
      'analysis',
      `${today.slice(0, 7)}-01`,
      'monthly',
      'card',
    ),
    subscription(
      'subscription-am',
      organization('org-am'),
      'professional',
      `${today.slice(0, 7)}-01`,
      'monthly',
      'transfer',
    ),
    subscription(
      'subscription-bank',
      organization('org-bank'),
      'analysis',
      lastAnniversary(today, '03-01'),
      'yearly',
      'transfer',
    ),
    subscription(
      'subscription-university',
      organization('org-university'),
      'student',
      lastAnniversary(today, '09-01'),
      'yearly',
      'transfer',
    ),
  ]
}

/** Days a transfer of the demo organisations takes to arrive. */
const TRANSFER_ARRIVES_DAYS = 8

/** The invoices of the demo plans: the periods so far, oldest first. */
export function createInvoices(
  today: IsoDate,
  subscriptions: readonly StoredSubscription[],
  seatsOf: (payer: Payer) => number,
): StoredInvoice[] {
  const invoices: StoredInvoice[] = []
  // The demo plans only, with the periods invoiced before the current one.
  const earlier: Record<string, number> = {
    'subscription-analyst': 1,
    'subscription-journalist': 1,
    'subscription-am': 2,
    'subscription-bank': 0,
    'subscription-university': 0,
  }
  const demo = subscriptions.filter((subscription) => subscription.id in earlier)
  const periods = demo.flatMap((subscription) => {
    const cycle = subscription.billingCycle ?? 'monthly'
    const months = cycle === 'yearly' ? 12 : 1
    return Array.from({ length: earlier[subscription.id] + 1 }, (_, index) => ({
      subscription,
      cycle,
      start: addMonths(subscription.periodStart, -months * index),
    }))
  })
  periods.sort((a, b) => a.start.localeCompare(b.start))
  for (const { subscription, cycle, start } of periods) {
    const plan = PLANS.find((candidate) => candidate.id === subscription.planId)
    if (!plan) continue
    const method = subscription.method ?? 'card'
    const issuedAt = `${start}T07:00:00Z`
    const arrival = addDays(start, TRANSFER_ARRIVES_DAYS)
    const paidAt = method === 'card' ? issuedAt : arrival <= today ? `${arrival}T10:30:00Z` : null
    invoices.push(
      planInvoice({
        id: `invoice-${subscription.id}-${start}`,
        number: invoiceNumber(invoices, issuedAt),
        payer: subscription.payer,
        plan,
        cycle,
        periodStart: start,
        seats: seatsOf(subscription.payer),
        method,
        issuedAt,
        paidAt,
      }),
    )
  }
  return invoices
}
