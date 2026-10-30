import type { BillingCycle, CheckoutMethod } from '@/shared/api/contracts'

export const BILLING_CYCLES: readonly BillingCycle[] = ['monthly', 'yearly']

/** Card and mobile money pay at once; a bank transfer pays an invoice (spec section 6). */
export const CHECKOUT_METHODS: readonly CheckoutMethod[] = ['card', 'mobileMoney', 'transfer']
