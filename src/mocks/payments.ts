import type { PaymentDto } from '@/shared/api/contracts'

/** Time for the payer to approve a mobile money payment on their phone, and for a card. */
const MOBILE_MONEY_MS = 3500
const CARD_MS = 2000

interface PendingPayment {
  payment: PaymentDto
  userId: string
  settleAt: number
  declined: boolean
  /** What the payment buys: the publication, or the plan. */
  onConfirmed: (payment: PaymentDto) => void
}

const payments = new Map<string, PendingPayment>()

/**
 * A payment sent to the provider: research bought in the library, or a plan in CFG. A mobile money
 * number ending in 0000 has no money left: the failure path of the prototype.
 */
export function startPayment(
  payment: PaymentDto,
  {
    userId,
    phone,
    onConfirmed,
  }: Pick<PendingPayment, 'userId' | 'onConfirmed'> & {
    phone: string | null
  },
): void {
  const digits = (phone ?? '').replace(/\D/g, '')
  payments.set(payment.id, {
    payment,
    userId,
    settleAt: Date.now() + (payment.method === 'card' ? CARD_MS : MOBILE_MONEY_MS),
    declined: payment.method === 'mobileMoney' && digits.endsWith('0000'),
    onConfirmed,
  })
}

/** The provider's confirmation (POST /payments/webhooks/{provider}) as the mock plays it. */
function settle(entry: PendingPayment): void {
  const { payment } = entry
  if (entry.declined) {
    payment.status = 'failed'
    payment.failureReason = 'The operator declined the payment: insufficient balance.'
    return
  }
  payment.status = 'confirmed'
  payment.confirmedAt = new Date().toISOString()
  entry.onConfirmed(payment)
}

/** Payments the provider has answered by now, whether or not the payer is still asking. */
export function settleDue(userId: string): void {
  for (const entry of payments.values()) {
    if (
      entry.userId === userId &&
      entry.payment.status === 'pending' &&
      Date.now() >= entry.settleAt
    )
      settle(entry)
  }
}

/** GET /payments/{id}: the user's own payments only. */
export function paymentOf(id: string, userId: string): PaymentDto | undefined {
  const entry = payments.get(id)
  if (!entry || entry.userId !== userId) return undefined
  if (entry.payment.status === 'pending' && Date.now() >= entry.settleAt) settle(entry)
  return entry.payment
}

export const newPaymentId = () => `payment-${Date.now().toString(36)}`
