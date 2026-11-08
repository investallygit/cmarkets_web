import type {
  CheckoutDto,
  CheckoutRequestDto,
  InvoiceDto,
  PaymentDto,
  PlanDto,
  SubscriptionDto,
} from '../contracts'
import { answer, route, send, sendBlob } from './define'

/** CMarket.Api/Controllers/Subscriptions: the plan, the checkout, payments and invoices. */
export const subscriptionsRoutes = {
  current: route('GET', '/subscription', answer<SubscriptionDto>()),
  plans: route('GET', '/subscription/plans', answer<PlanDto[]>()),
  checkout: route('POST', '/subscription/checkout', answer<CheckoutDto>()),
  payment: route('GET', '/payments/{id}', answer<PaymentDto>()),
  invoices: route('GET', '/invoices', answer<InvoiceDto[]>()),
  invoicePdf: route('GET', '/invoices/{id}/pdf', answer<Blob>()),
}

export const subscriptionsApi = {
  /** The plan that covers the user; 404 when none does. */
  current: (signal?: AbortSignal) => send(subscriptionsRoutes.current, { signal }),
  /** The plans the user may choose. */
  plans: (signal?: AbortSignal) => send(subscriptionsRoutes.plans, { signal }),
  /** Every plan, without the session: the home page shows the same to everyone. */
  publicPlans: (signal?: AbortSignal) =>
    send(subscriptionsRoutes.plans, { signal, anonymous: true }),
  /** A bank transfer changes the plan at once; a card or mobile money payment is followed. */
  checkout: (request: CheckoutRequestDto) => send(subscriptionsRoutes.checkout, { body: request }),
  /** A payment's status, asked again while pending (a plan's, a publication's). */
  payment: (id: string, signal?: AbortSignal) =>
    send(subscriptionsRoutes.payment, { params: { id }, signal }),
  /** Newest first. */
  invoices: (signal?: AbortSignal) => send(subscriptionsRoutes.invoices, { signal }),
  invoicePdf: (id: string) => sendBlob(subscriptionsRoutes.invoicePdf, { params: { id } }),
}
