import type {
  BillingCycle,
  CheckoutMethod,
  InvoiceDto,
  IsoDate,
  PlanDto,
  TransferDetailsDto,
} from '@/shared/api/contracts'
import { amountsFromNet, amountsFromTotal } from '@/shared/lib/billing'
import { addDays, addMonths } from '@/shared/lib/isoDate'

/** Who pays: a user for an individual account, an organisation for its members. */
export type Payer = { type: 'user'; id: string } | { type: 'organization'; id: string }

export interface StoredSubscription {
  id: string
  payer: Payer
  planId: string
  status: 'trial' | 'active'
  /** null during the trial. */
  billingCycle: BillingCycle | null
  periodStart: IsoDate
  /** First day after the period. */
  periodEnd: IsoDate
  method: CheckoutMethod | null
}

export interface StoredInvoice extends InvoiceDto {
  payer: Payer
}

/** CMarket's account for the transfers, fictitious. */
export const CMARKET_BANK: Omit<TransferDetailsDto, 'reference'> = {
  bank: 'Banque Exemple Cameroun, Douala',
  iban: 'CM21 10005 00001 01234567890 12',
  bic: 'BEXMCMCX',
}

/** Days to pay an invoice by bank transfer. */
export const TRANSFER_DAYS = 15

export const samePayer = (a: Payer, b: Payer) => a.type === b.type && a.id === b.id

export function periodEndOf(start: IsoDate, cycle: BillingCycle): IsoDate {
  return addMonths(start, cycle === 'yearly' ? 12 : 1)
}

export const priceOf = (plan: PlanDto, cycle: BillingCycle) =>
  cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice

/** A paid plan renews at the end of its period; a trial does not. */
export function renewed(subscription: StoredSubscription, today: IsoDate): StoredSubscription {
  const { billingCycle } = subscription
  if (subscription.status !== 'active' || !billingCycle) return subscription
  let { periodStart, periodEnd } = subscription
  while (periodEnd <= today) {
    periodStart = periodEnd
    periodEnd = periodEndOf(periodStart, billingCycle)
  }
  return { ...subscription, periodStart, periodEnd }
}

export function isExpired(subscription: StoredSubscription, today: IsoDate): boolean {
  return subscription.status === 'trial' && subscription.periodEnd <= today
}

/** CM-2026-000105: numbered in sequence within the year. */
export function invoiceNumber(invoices: readonly StoredInvoice[], issuedAt: string): string {
  const year = issuedAt.slice(0, 4)
  const issued = invoices.filter((invoice) => invoice.number.startsWith(`CM-${year}-`)).length
  return `CM-${year}-${String(101 + issued).padStart(6, '0')}`
}

interface PlanInvoice {
  id: string
  number: string
  payer: Payer
  plan: PlanDto
  cycle: BillingCycle
  periodStart: IsoDate
  seats: number
  method: CheckoutMethod
  issuedAt: string
  /** null while a transfer is due. */
  paidAt: string | null
}

/** The invoice of a period of a plan, per user excluding VAT. */
export function planInvoice(invoice: PlanInvoice): StoredInvoice {
  const { plan, cycle, periodStart, seats, method, issuedAt, paidAt } = invoice
  const amounts = amountsFromNet(priceOf(plan, cycle), seats, plan.taxRatePct)
  const due = method === 'transfer' && !paidAt
  return {
    id: invoice.id,
    number: invoice.number,
    payer: invoice.payer,
    kind: 'subscription',
    label: plan.name,
    billingCycle: cycle,
    periodStart,
    periodEnd: addDays(periodEndOf(periodStart, cycle), -1),
    issuedAt,
    dueOn: method === 'transfer' ? addDays(issuedAt.slice(0, 10), TRANSFER_DAYS) : null,
    paidAt,
    ...amounts,
    taxRatePct: plan.taxRatePct,
    currency: plan.currency,
    method,
    status: due ? 'due' : 'paid',
    transfer: due ? { ...CMARKET_BANK, reference: invoice.number } : null,
  }
}

interface PublicationInvoice {
  id: string
  number: string
  userId: string
  title: string
  total: number
  taxRatePct: number
  method: CheckoutMethod
  paidAt: string
}

/** The receipt of a publication bought: its price includes the VAT. */
export function publicationInvoice(invoice: PublicationInvoice): StoredInvoice {
  return {
    id: invoice.id,
    number: invoice.number,
    payer: { type: 'user', id: invoice.userId },
    kind: 'publication',
    label: invoice.title,
    billingCycle: null,
    periodStart: null,
    periodEnd: null,
    issuedAt: invoice.paidAt,
    dueOn: null,
    paidAt: invoice.paidAt,
    ...amountsFromTotal(invoice.total, invoice.taxRatePct),
    taxRatePct: invoice.taxRatePct,
    currency: 'XAF',
    method: invoice.method,
    status: 'paid',
    transfer: null,
  }
}
