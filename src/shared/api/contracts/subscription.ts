import type { CurrencyCode, IsoDate, IsoDateTime } from './common'
import type { ClientAccountType, ModuleCode } from './me'
import type { PaymentDto } from './research'

export type BillingCycle = 'monthly' | 'yearly'

/** GET /subscription/plans: prices per user, excluding VAT. */
export interface PlanDto {
  id: string
  name: string
  modules: ModuleCode[]
  monthlyPrice: number
  yearlyPrice: number
  currency: CurrencyCode
  taxRatePct: number
  /** Account types that may choose it, such as the student plan. */
  accountTypes: ClientAccountType[]
}

/**
 * A failed renewal is tried again for 7 days, the plan in force meanwhile; an Admin's suspension
 * cuts the modules at once (ROADMAP decision 7).
 */
export type SubscriptionStatus = 'trial' | 'active' | 'paymentFailed' | 'suspended' | 'expired'

/** GET /subscription: the plan that covers the user, their own or their organisation's; 404 for none. */
export interface SubscriptionDto {
  planId: string
  status: SubscriptionStatus
  modules: ModuleCode[]
  /** null during the free trial. */
  billingCycle: BillingCycle | null
  /** First day after the trial or the period paid: the plan renews, or the trial ends, then. */
  periodEnd: IsoDate
  /** Users covered: the user, or the organisation's members. */
  seats: number
  payer: 'user' | 'organization'
  /** The user's own plan, or the organisation's for its administrators. */
  canManage: boolean
  /** An invoice still to pay by bank transfer. */
  dueInvoiceId: string | null
  /** The plan's name, the one given by agreement included, which the plans of the account omit. */
  planName: string
}

export type CheckoutMethod = 'card' | 'mobileMoney' | 'transfer'

/** A plan's method: the checkout's, or an agreement (a media's free plan, given by an Admin). */
export type PlanPaymentMethod = CheckoutMethod | 'agreement'

/** POST /subscription/checkout */
export interface CheckoutRequestDto {
  planId: string
  billingCycle: BillingCycle
  method: CheckoutMethod
  /** The mobile money number to charge. */
  phone: string | null
}

/**
 * Answer of the checkout: a card or mobile money payment to follow at GET /payments/{id}, the
 * plan changing once it is confirmed; or, for a bank transfer, the invoice to pay, the plan
 * changing at once.
 */
export interface CheckoutDto {
  payment: PaymentDto | null
  invoice: InvoiceDto | null
  /** The plan as it stands: the new one after a transfer, the current one until a payment. */
  subscription: SubscriptionDto | null
}

export type InvoiceStatus = 'paid' | 'due' | 'void'

/** Bank details printed on an invoice paid by transfer. */
export interface TransferDetailsDto {
  bank: string
  iban: string
  bic: string
  /** To quote with the transfer. */
  reference: string
}

/** GET /invoices: the subscription and the research the user paid, newest first. */
export interface InvoiceDto {
  id: string
  number: string
  kind: 'subscription' | 'publication'
  /** The plan's name or the publication's title. */
  label: string
  billingCycle: BillingCycle | null
  periodStart: IsoDate | null
  periodEnd: IsoDate | null
  issuedAt: IsoDateTime
  /** A bank transfer is due by then. */
  dueOn: IsoDate | null
  paidAt: IsoDateTime | null
  /** Excluding VAT. */
  amount: number
  taxRatePct: number
  taxAmount: number
  total: number
  currency: CurrencyCode
  method: PlanPaymentMethod | null
  status: InvoiceStatus
  transfer: TransferDetailsDto | null
}
