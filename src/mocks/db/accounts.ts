import { MODULES, type ModuleCode } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import {
  createAccounts,
  INVITATION_FIXTURES,
  ORGANIZATION_FIXTURES,
  type StoredAccount,
  type StoredInvitation,
  type StoredOrganization,
} from '../fixtures/accounts'
import { createInvoices, createSubscriptions, PLANS } from '../fixtures/billing'
import {
  isExpired,
  renewed,
  samePayer,
  type Payer,
  type StoredInvoice,
  type StoredSubscription,
} from '../lib/billing'
import { startedAt } from './market'
import { sharedStore } from './storage'

/** Accounts, their organisations and invitations, and the plans and invoices that cover them. */

/** Accounts of every user: the demo users, their colleagues, and whoever signs up. */
export const accountStore = sharedStore<StoredAccount[]>('accounts', createAccounts)

export const organizationStore = sharedStore<StoredOrganization[]>('organizations', () =>
  ORGANIZATION_FIXTURES.map((organization) => ({ ...organization })),
)

export const invitationStore = sharedStore<StoredInvitation[]>('invitations', () =>
  INVITATION_FIXTURES.map((invitation) => ({ ...invitation })),
)

export function findAccount(id: string): StoredAccount | undefined {
  return accountStore.read().find((account) => account.id === id)
}

export function accountByEmail(email: string): StoredAccount | undefined {
  const address = email.trim().toLowerCase()
  return accountStore.read().find((account) => account.email.toLowerCase() === address)
}

/** Writes back an account changed in place. */
export function saveAccounts(): void {
  accountStore.write(accountStore.read())
}

export const payerOf = (account: StoredAccount): Payer =>
  account.organizationId
    ? { type: 'organization', id: account.organizationId }
    : { type: 'user', id: account.id }

/** Users a plan covers: the account, or the organisation's members. */
export function seatsOf(payer: Payer): number {
  if (payer.type === 'user') return 1
  return accountStore.read().filter((account) => account.organizationId === payer.id).length
}

export const subscriptionStore = sharedStore<StoredSubscription[]>('subscriptions', () =>
  createSubscriptions(toMarketDay(startedAt)),
)

export const invoiceStore = sharedStore<StoredInvoice[]>('invoices', () =>
  createInvoices(toMarketDay(startedAt), subscriptionStore.read(), seatsOf),
)

/** The subscription that covers an account: its own, or its organisation's, renewed if due. */
export function subscriptionOf(account: StoredAccount): StoredSubscription | undefined {
  const payer = payerOf(account)
  const subscriptions = subscriptionStore.read()
  const index = subscriptions.findIndex((subscription) => samePayer(subscription.payer, payer))
  if (index < 0) return undefined
  const current = renewed(subscriptions[index], toMarketDay(Date.now()))
  if (current !== subscriptions[index]) {
    subscriptions[index] = current
    subscriptionStore.write(subscriptions)
  }
  return current
}

/** Modules of the plan or trial that covers an account; employees use every module. */
export function modulesOf(account: StoredAccount): ModuleCode[] {
  if (account.accountType === 'dataAdmin' || account.accountType === 'admin') return [...MODULES]
  const subscription = subscriptionOf(account)
  if (!subscription || isExpired(subscription, toMarketDay(Date.now()))) return []
  return PLANS.find((plan) => plan.id === subscription.planId)?.modules ?? []
}
