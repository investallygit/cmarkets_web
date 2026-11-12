import type { CurrencyCode, IsoDate, IsoDateTime } from './common'
import type { AccountType, ModuleCode } from './me'
import type { BillingCycle, PlanPaymentMethod } from './subscription'

// SUBS, subscription management (screen 14, spec section 10, ROADMAP step 34): a row per client
// account, covered by its own plan or its organisation's ("via organisation"), and per
// organisation that pays one. CMarket.Api/Controllers/Admin/AdminSubscriptionsController.

/**
 * SUBS's status of a subscription: expiring soon, an active plan that ends within 30 days;
 * payment failed, a renewal tried again for 7 days, the plan in force meanwhile; expired, a trial
 * past its end too.
 */
export const SUBSCRIPTION_LIST_STATUSES = [
  'active',
  'expiringSoon',
  'paymentFailed',
  'suspended',
  'trial',
  'expired',
] as const
export type SubscriptionListStatus = (typeof SUBSCRIPTION_LIST_STATUSES)[number]

/** ?sort= of the list, "-" first for a descending order; by expiry by default (the spec). */
export const SUBSCRIPTION_SORTS = [
  'account',
  'type',
  'plan',
  'status',
  'expiry',
  'lastPayment',
] as const
export type SubscriptionSort = (typeof SUBSCRIPTION_SORTS)[number]

/** "Expiry" filter: the plans in force that end within that many days. */
export const EXPIRY_WINDOWS = [7, 30, 90] as const

export type SubscriptionAccountKind = 'user' | 'organization'

/** An organisation's members of one type: "Manager ×5". */
export interface MemberCountDto {
  type: AccountType
  count: number
}

/** A payer's latest payment, as its paid invoice tells it. */
export interface LastPaymentDto {
  at: IsoDateTime
  /** VAT included. */
  amount: number
  currency: CurrencyCode
  method: PlanPaymentMethod | null
}

export interface InvoiceRefDto {
  id: string
  number: string
}

/** GET /admin/subscriptions: a row. */
export interface AdminSubscriptionRowDto {
  /** The user's id, or the organisation's. */
  accountId: string
  kind: SubscriptionAccountKind
  name: string
  email: string | null
  accountType: AccountType | null
  /** An organisation's members by type, the most numerous first; empty for a user. */
  members: MemberCountDto[]
  /** A member covered by its organisation's plan: its payment, invoice and renewal are the organisation's. */
  viaOrganization: { id: string; name: string } | null
  planId: string
  planName: string
  /** null for a trial. */
  billingCycle: BillingCycle | null
  status: SubscriptionListStatus
  /** The first day after the period: the plan renews or ends then. */
  expiresOn: IsoDate
  lastPayment: LastPaymentDto | null
  lastInvoice: InvoiceRefDto | null
  /** null for a member and for a trial. */
  autoRenew: boolean | null
}

/** GET /admin/subscriptions?q=&plan=&status=&expiringWithinDays=&sort=&page= */
export interface AdminSubscriptionQuery {
  /** Part of an account's name or e-mail, or of its organisation's name. */
  q?: string
  plan?: string
  status?: SubscriptionListStatus
  expiringWithinDays?: number
  /** A column of the list, "-" first for a descending order: "-lastPayment". */
  sort?: string
  page?: number
  pageSize?: number
}

/** GET /admin/subscriptions/stats: the counters, in accounts covered. */
export interface SubscriptionStatsDto {
  /** Accounts covered by a paid plan in force, those expiring soon included. */
  active: number
  expiringSoon: number
  expiredNotRenewed: number
  /** Charges of the plans that failed over the last 30 days. */
  failedPayments: number
  /** The plans' invoices paid since the first of the month in Douala, VAT included. */
  collectedThisMonth: number
  currency: CurrencyCode
}

/** The card or number a renewal charges, by its last four characters. */
export interface StoredMethodDto {
  method: PlanPaymentMethod
  ending: string
}

/** GET /admin/subscriptions/{accountId}: the account and the subscription that covers it. */
export interface AdminSubscriptionDetailsDto {
  accountId: string
  kind: SubscriptionAccountKind
  name: string
  email: string | null
  accountType: AccountType | null
  members: MemberCountDto[]
  viaOrganization: { id: string; name: string } | null
  /** Whose subscription the actions change: the user's own, or the organisation's for a member. */
  payer: { kind: SubscriptionAccountKind; id: string; name: string }
  planId: string
  planName: string
  billingCycle: BillingCycle | null
  /** A period for every seat, excluding VAT; 0 for a trial. */
  price: number
  currency: CurrencyCode
  seats: number
  status: SubscriptionListStatus
  startedOn: IsoDate
  expiresOn: IsoDate
  autoRenew: boolean
  method: PlanPaymentMethod | null
  storedMethod: StoredMethodDto | null
  /** The last day a failed charge is tried again. */
  retryUntil: IsoDate | null
  suspension: { at: IsoDateTime; by: string | null; reason: string } | null
  lastPayment: LastPaymentDto | null
  lastInvoice: InvoiceRefDto | null
  /** The plans an Admin may change it to. */
  planIds: string[]
}

export type PaymentLineStatus = 'paid' | 'failedThenPaid' | 'failed' | 'pending' | 'due' | 'void'

/** GET /admin/subscriptions/{accountId}/payments, the latest first. */
export interface SubscriptionPaymentDto {
  at: IsoDateTime
  /** null for a charge without an invoice: failed, or waiting for its provider. */
  invoice: InvoiceRefDto | null
  /** VAT included. */
  amount: number
  currency: CurrencyCode
  method: PlanPaymentMethod | null
  status: PaymentLineStatus
  failureReason: string | null
}

/** GET /admin/subscriptions/plans: the catalogue, the plan given by agreement included. */
export interface AdminPlanDto {
  id: string
  name: string
  modules: ModuleCode[]
  monthlyPrice: number
  yearlyPrice: number
  currency: CurrencyCode
  taxRatePct: number
  accountTypes: AccountType[]
  byAgreement: boolean
}

/**
 * GET /admin/subscriptions/{accountId}/proration?planId=&billingCycle=: a change of plan as PUT
 * .../plan would make it today, prorated by the day (ROADMAP decision 7).
 */
export interface PlanChangeProrationDto {
  planId: string
  planName: string
  billingCycle: BillingCycle
  daysLeft: number
  /** What the days left of the plan in force are worth, every seat, excluding VAT. */
  valueLeft: number
  /** Days of the new plan from today: those the value buys, or a full period charged now. */
  newDays: number
  expiresOn: IsoDate
  /** A full period charged at once, VAT included; 0 when the value pays or the plan is free. */
  chargeNow: number
  free: boolean
  currency: CurrencyCode
}

/** PUT /admin/subscriptions/{accountId}/plan */
export interface SubscriptionPlanWriteDto {
  planId: string
  billingCycle: BillingCycle
}

/** POST /admin/subscriptions/{accountId}/extend: a later day, free of charge, with a reason. */
export interface SubscriptionExtendDto {
  until: IsoDate
  reason: string
}

/** POST /admin/invoices/{id}/resend */
export interface InvoiceSentDto {
  invoiceId: string
  number: string
  sentTo: string[]
}
