import { http, HttpResponse } from 'msw'
import type {
  BillingCycle,
  CheckoutMethod,
  CheckoutRequestDto,
  InvoiceDto,
  MemberInviteDto,
  MemberUpdateDto,
  OrganizationDto,
  OrganizationMemberDto,
  OrganizationRole,
  PaymentDto,
  PlanDto,
  SubscriptionDto,
} from '@/shared/api/contracts'
import { amountsFromNet } from '@/shared/lib/billing'
import { formatIsoDate, formatNumber, toMarketDay } from '@/shared/lib/format'
import {
  accountByEmail,
  accountStore,
  currentAccount,
  invitationStore,
  invoiceStore,
  organizationStore,
  payerOf,
  saveAccounts,
  seatsOf,
  subscriptionOf,
  subscriptionStore,
} from '../db'
import type { StoredAccount } from '../fixtures/accounts'
import { PLANS } from '../fixtures/billing'
import { isEmail, randomToken } from '../lib/auth'
import {
  invoiceNumber,
  isExpired,
  periodEndOf,
  planInvoice,
  priceOf,
  samePayer,
  type StoredInvoice,
  type StoredSubscription,
} from '../lib/billing'
import { api, latency, noContent, problem } from '../lib/http'
import { createPdf } from '../lib/pdf'
import { newPaymentId, settleDue, startPayment } from '../payments'

const ROLES: readonly OrganizationRole[] = ['admin', 'member']
const CYCLES: readonly BillingCycle[] = ['monthly', 'yearly']
const METHODS: readonly CheckoutMethod[] = ['card', 'mobileMoney', 'transfer']

const forbidden = (detail: string) => problem(403, 'Forbidden', detail)

function organizationOf(account: StoredAccount) {
  return organizationStore.read().find((organization) => organization.id === account.organizationId)
}

const isAdmin = (account: StoredAccount) =>
  Boolean(account.organizationId) && account.organizationRole === 'admin'

function membersOf(organizationId: string): StoredAccount[] {
  return accountStore.read().filter((account) => account.organizationId === organizationId)
}

function memberDto(member: StoredAccount, self: StoredAccount): OrganizationMemberDto {
  return {
    id: member.id,
    displayName: member.displayName,
    email: member.email,
    accountType: member.accountType,
    role: member.organizationRole ?? 'member',
    status: 'active',
    since: member.createdAt,
    isSelf: member.id === self.id,
  }
}

function membersDto(account: StoredAccount): OrganizationMemberDto[] {
  const organizationId = account.organizationId ?? ''
  const members = membersOf(organizationId)
    .sort(
      (a, b) =>
        Number(b.organizationRole === 'admin') - Number(a.organizationRole === 'admin') ||
        a.displayName.localeCompare(b.displayName),
    )
    .map((member) => memberDto(member, account))
  const invitations = invitationStore
    .read()
    .filter((invitation) => invitation.organizationId === organizationId)
    .map((invitation): OrganizationMemberDto => ({
      id: invitation.id,
      displayName: null,
      email: invitation.email,
      accountType: null,
      role: invitation.role,
      status: 'invited',
      since: invitation.invitedAt,
      isSelf: false,
    }))
  return [...members, ...invitations]
}

const plansFor = (account: StoredAccount): PlanDto[] =>
  PLANS.filter((plan) => plan.accountTypes.some((type) => type === account.accountType))

function subscriptionDto(
  account: StoredAccount,
  subscription: StoredSubscription,
): SubscriptionDto {
  const payer = payerOf(account)
  const due = invoiceStore
    .read()
    .filter((invoice) => samePayer(invoice.payer, payer) && invoice.status === 'due')
    .at(-1)
  return {
    planId: subscription.planId,
    status: isExpired(subscription, toMarketDay(Date.now())) ? 'expired' : subscription.status,
    modules: PLANS.find((plan) => plan.id === subscription.planId)?.modules ?? [],
    billingCycle: subscription.billingCycle,
    periodEnd: subscription.periodEnd,
    seats: seatsOf(payer),
    payer: payer.type === 'user' ? 'user' : 'organization',
    canManage: payer.type === 'user' || isAdmin(account),
    dueInvoiceId: due?.id ?? null,
  }
}

/** The plan chosen starts today, for a full period. */
function applyPlan(
  account: StoredAccount,
  plan: PlanDto,
  cycle: BillingCycle,
  method: CheckoutMethod,
) {
  const payer = payerOf(account)
  const today = toMarketDay(Date.now())
  const subscriptions = subscriptionStore.read().filter((item) => !samePayer(item.payer, payer))
  const subscription: StoredSubscription = {
    id: `subscription-${randomToken(6)}`,
    payer,
    planId: plan.id,
    status: 'active',
    billingCycle: cycle,
    periodStart: today,
    periodEnd: periodEndOf(today, cycle),
    method,
  }
  subscriptionStore.write([...subscriptions, subscription])
  return subscription
}

function issueInvoice(
  account: StoredAccount,
  plan: PlanDto,
  cycle: BillingCycle,
  method: CheckoutMethod,
  paidAt: string | null,
): StoredInvoice {
  const invoices = invoiceStore.read()
  const issuedAt = new Date().toISOString()
  const invoice = planInvoice({
    id: `invoice-${randomToken(6)}`,
    number: invoiceNumber(invoices, issuedAt),
    payer: payerOf(account),
    plan,
    cycle,
    periodStart: toMarketDay(issuedAt),
    seats: seatsOf(payerOf(account)),
    method,
    issuedAt,
    paidAt,
  })
  invoiceStore.write([...invoices, invoice])
  return invoice
}

/** The invoice as the API returns it, without the payer the mock files it under. */
function invoiceDto(stored: StoredInvoice): InvoiceDto {
  const invoice: Partial<StoredInvoice> = { ...stored }
  delete invoice.payer
  return invoice as InvoiceDto
}

/** The user's own invoices, and their organisation's for its administrators. */
function invoicesOf(account: StoredAccount): StoredInvoice[] {
  return invoiceStore
    .read()
    .filter(
      (invoice) =>
        (invoice.payer.type === 'user' && invoice.payer.id === account.id) ||
        (invoice.payer.type === 'organization' &&
          invoice.payer.id === account.organizationId &&
          isAdmin(account)),
    )
}

const xaf = (value: number) => `XAF ${formatNumber(value, 'en', 0)}`

const METHOD_NAMES: Record<CheckoutMethod, string> = {
  card: 'Card',
  mobileMoney: 'Mobile money',
  transfer: 'Bank transfer',
}

function invoicePdf(invoice: StoredInvoice, account: StoredAccount) {
  const organization = invoice.payer.type === 'organization' ? organizationOf(account) : undefined
  const period =
    invoice.periodStart && invoice.periodEnd
      ? ` (${invoice.billingCycle}, ${formatIsoDate(invoice.periodStart)} - ${formatIsoDate(invoice.periodEnd)})`
      : ''
  const lines = [
    `Invoice ${invoice.number}`,
    `Issued on ${formatIsoDate(toMarketDay(invoice.issuedAt))}`,
    `Billed to: ${organization?.name ?? account.displayName}, ${account.email}`,
    '',
    invoice.kind === 'subscription'
      ? `${invoice.label} plan${period}`
      : `Research: ${invoice.label}`,
    `Amount excluding VAT: ${xaf(invoice.amount)}`,
    `VAT ${invoice.taxRatePct}%: ${xaf(invoice.taxAmount)}`,
    `Total: ${xaf(invoice.total)}`,
    '',
    invoice.status === 'paid'
      ? `Paid${invoice.method ? ` by ${METHOD_NAMES[invoice.method].toLowerCase()}` : ''} on ${formatIsoDate(toMarketDay(invoice.paidAt ?? invoice.issuedAt))}`
      : `To pay by ${invoice.dueOn ? formatIsoDate(invoice.dueOn) : ''}`,
    ...(invoice.transfer
      ? [
          `Bank: ${invoice.transfer.bank}`,
          `IBAN: ${invoice.transfer.iban}  BIC: ${invoice.transfer.bic}`,
          `Reference: ${invoice.transfer.reference}`,
        ]
      : []),
    '',
    'CMarket SA, Douala, Cameroon',
  ]
  return createPdf(`CMarket invoice ${invoice.number}`, lines)
}

/**
 * CFG (spec section 10): the organisation and its members, the subscription with its plans and
 * checkout by card, mobile money or bank transfer, and the invoices in PDF.
 */
export const accountHandlers = [
  http.get(api('/organization'), async () => {
    await latency()
    const account = currentAccount()
    const organization = organizationOf(account)
    if (!organization) return problem(404, 'No organisation', 'An individual account.')
    return HttpResponse.json<OrganizationDto>({
      id: organization.id,
      name: organization.name,
      createdAt: organization.createdAt,
      memberCount: membersOf(organization.id).length,
      myRole: account.organizationRole ?? 'member',
    })
  }),

  http.get(api('/organization/members'), async () => {
    await latency()
    const account = currentAccount()
    if (!organizationOf(account)) return problem(404, 'No organisation', 'An individual account.')
    return HttpResponse.json(membersDto(account))
  }),

  http.post(api('/organization/members'), async ({ request }) => {
    await latency()
    const account = currentAccount()
    const organizationId = account.organizationId
    if (!organizationId || !isAdmin(account)) {
      return forbidden('Only an administrator of the organisation invites members.')
    }
    const body = (await request.json()) as Partial<MemberInviteDto>
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    if (!isEmail(email))
      return problem(400, 'Invalid invitation', undefined, { email: ['An e-mail address.'] })
    const role = ROLES.find((candidate) => candidate === body.role) ?? 'member'
    if (accountByEmail(email)?.organizationId === organizationId) {
      return problem(409, 'Already a member', `${email} is a member already.`)
    }
    const invitations = invitationStore.read()
    if (
      invitations.some((item) => item.organizationId === organizationId && item.email === email)
    ) {
      return problem(409, 'Already invited', `${email} is invited already.`)
    }
    const invitation = {
      id: `invitation-${randomToken(6)}`,
      organizationId,
      email,
      role,
      invitedAt: new Date().toISOString(),
    }
    invitationStore.write([...invitations, invitation])
    const dto = membersDto(account).find((member) => member.id === invitation.id)
    return HttpResponse.json(dto, { status: 201 })
  }),

  http.put(api('/organization/members/:id'), async ({ params, request }) => {
    await latency()
    const account = currentAccount()
    const organizationId = account.organizationId
    if (!organizationId || !isAdmin(account)) {
      return forbidden('Only an administrator of the organisation changes the roles.')
    }
    const body = (await request.json()) as Partial<MemberUpdateDto>
    const role = ROLES.find((candidate) => candidate === body.role)
    if (!role)
      return problem(400, 'Invalid role', undefined, { role: ['Administrator or member.'] })
    const id = String(params.id)
    const invitations = invitationStore.read()
    const invitation = invitations.find(
      (item) => item.id === id && item.organizationId === organizationId,
    )
    if (invitation) {
      invitation.role = role
      invitationStore.write(invitations)
    } else {
      const members = membersOf(organizationId)
      const member = members.find((item) => item.id === id)
      if (!member) return problem(404, 'Member not found', `No member ${id}.`)
      const admins = members.filter((item) => item.organizationRole === 'admin')
      if (role === 'member' && member.organizationRole === 'admin' && admins.length === 1) {
        return problem(
          409,
          'Last administrator',
          'The organisation keeps at least one administrator.',
        )
      }
      member.organizationRole = role
      saveAccounts()
    }
    return HttpResponse.json(membersDto(account).find((member) => member.id === id))
  }),

  http.delete(api('/organization/members/:id'), async ({ params }) => {
    await latency()
    const account = currentAccount()
    const organizationId = account.organizationId
    if (!organizationId || !isAdmin(account)) {
      return forbidden('Only an administrator of the organisation removes members.')
    }
    const id = String(params.id)
    if (id === account.id) {
      return problem(409, 'Own account', 'Another administrator removes you from the organisation.')
    }
    const invitations = invitationStore.read()
    if (invitations.some((item) => item.id === id && item.organizationId === organizationId)) {
      invitationStore.write(invitations.filter((item) => item.id !== id))
      return noContent()
    }
    const member = membersOf(organizationId).find((item) => item.id === id)
    if (!member) return problem(404, 'Member not found', `No member ${id}.`)
    // The member keeps the account, without the organisation's plan.
    member.organizationId = null
    member.organizationRole = null
    saveAccounts()
    return noContent()
  }),

  http.get(api('/subscription/plans'), async () => {
    await latency()
    return HttpResponse.json(plansFor(currentAccount()))
  }),

  http.get(api('/subscription'), async () => {
    await latency()
    const account = currentAccount()
    settleDue(account.id)
    const subscription = subscriptionOf(account)
    if (!subscription) return problem(404, 'No subscription', 'No plan covers this account.')
    return HttpResponse.json(subscriptionDto(account, subscription))
  }),

  http.post(api('/subscription/checkout'), async ({ request }) => {
    await latency()
    const account = currentAccount()
    const current = subscriptionOf(account)
    if (payerOf(account).type === 'organization' && !isAdmin(account)) {
      return forbidden("The organisation's administrators choose its plan.")
    }
    const body = (await request.json()) as Partial<CheckoutRequestDto>
    const plan = plansFor(account).find((candidate) => candidate.id === body.planId)
    const cycle = CYCLES.find((candidate) => candidate === body.billingCycle)
    const method = METHODS.find((candidate) => candidate === body.method)
    const errors: Record<string, string[]> = {}
    if (!plan) errors.planId = ['A plan offered to this account.']
    if (!cycle) errors.billingCycle = ['Monthly or yearly.']
    if (!method) errors.method = ['Card, mobile money or bank transfer.']
    const digits = (body.phone ?? '').replace(/[\s.+-]/g, '')
    if (method === 'mobileMoney' && !/^\d{8,15}$/.test(digits)) {
      errors.phone = ['A mobile money number, e.g. +237 6 70 12 34 56.']
    }
    if (!plan || !cycle || !method || Object.keys(errors).length > 0) {
      return problem(400, 'Invalid checkout', undefined, errors)
    }
    if (
      current?.status === 'active' &&
      current.planId === plan.id &&
      current.billingCycle === cycle
    ) {
      return problem(409, 'Current plan', 'This is the plan already paid.')
    }

    if (method === 'transfer') {
      // Paid against the invoice: the plan applies now, the invoice is due in 15 days.
      const subscription = applyPlan(account, plan, cycle, method)
      const invoice = issueInvoice(account, plan, cycle, method, null)
      return HttpResponse.json({
        payment: null,
        invoice: invoiceDto(invoice),
        subscription: subscriptionDto(account, subscription),
      })
    }
    const amount = amountsFromNet(priceOf(plan, cycle), seatsOf(payerOf(account)), plan.taxRatePct)
    const payment: PaymentDto = {
      id: newPaymentId(),
      purpose: 'subscription',
      publicationId: null,
      planId: plan.id,
      amount: amount.total,
      currency: plan.currency,
      method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      failureReason: null,
    }
    startPayment(payment, {
      userId: account.id,
      phone: body.phone ?? null,
      onConfirmed: (confirmed) => {
        applyPlan(account, plan, cycle, method)
        issueInvoice(account, plan, cycle, method, confirmed.confirmedAt)
      },
    })
    return HttpResponse.json(
      {
        payment,
        invoice: null,
        subscription: current ? subscriptionDto(account, current) : null,
      },
      { status: 202 },
    )
  }),

  http.get(api('/invoices'), async () => {
    await latency()
    const account = currentAccount()
    settleDue(account.id)
    const invoices = invoicesOf(account)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
      .map(invoiceDto)
    return HttpResponse.json(invoices)
  }),

  http.get(api('/invoices/:id/pdf'), async ({ params }) => {
    await latency()
    const account = currentAccount()
    const invoice = invoicesOf(account).find((item) => item.id === params.id)
    if (!invoice) return problem(404, 'Invoice not found', `No invoice ${String(params.id)}.`)
    return new HttpResponse(invoicePdf(invoice, account), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
      },
    })
  }),
]
