import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, isApiError } from '@/shared/api'
import type {
  CheckoutDto,
  CheckoutRequestDto,
  InvoiceDto,
  PaymentDto,
  PlanDto,
  SubscriptionDto,
} from '@/shared/api/contracts'

export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  payment: (id: string) => [...subscriptionKeys.all, 'payment', id] as const,
  invoices: ['invoices'] as const,
}

/** A pending payment is asked for its status this often until the provider answers. */
const PAYMENT_POLL_MS = 1500

/** GET /subscription: the plan that covers the user; null when none does (a 404). */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: async ({ signal }) => {
      try {
        return await apiClient.get<SubscriptionDto>('/subscription', { signal })
      } catch (error) {
        if (isApiError(error, 404)) return null
        throw error
      }
    },
  })
}

/** GET /subscription/plans: the plans the user may choose. */
export function usePlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: ({ signal }) => apiClient.get<PlanDto[]>('/subscription/plans', { signal }),
    staleTime: Infinity,
  })
}

/**
 * POST /subscription/checkout. A bank transfer changes the plan at once and issues the invoice;
 * a card or mobile money payment is followed with useSubscriptionPayment.
 */
export function useCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CheckoutRequestDto) =>
      apiClient.post<CheckoutDto>('/subscription/checkout', request),
    onSuccess: (checkout) => {
      queryClient.setQueryData(subscriptionKeys.current(), checkout.subscription)
      if (checkout.invoice)
        void queryClient.invalidateQueries({ queryKey: subscriptionKeys.invoices })
    },
  })
}

/** GET /payments/{id}, asked again while pending; once confirmed, the new plan and its invoice. */
export function useSubscriptionPayment(payment: PaymentDto | null) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: subscriptionKeys.payment(payment?.id ?? ''),
    queryFn: async ({ signal }) => {
      const current = await apiClient.get<PaymentDto>(
        `/payments/${encodeURIComponent(payment?.id ?? '')}`,
        { signal },
      )
      if (current.status === 'confirmed') {
        void queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() })
        void queryClient.invalidateQueries({ queryKey: subscriptionKeys.invoices })
      }
      return current
    },
    enabled: Boolean(payment),
    initialData: payment ?? undefined,
    refetchInterval: (current) =>
      current.state.data?.status === 'pending' ? PAYMENT_POLL_MS : false,
    staleTime: 0,
  })
}

/** GET /invoices: newest first. */
export function useInvoices() {
  return useQuery({
    queryKey: subscriptionKeys.invoices,
    queryFn: ({ signal }) => apiClient.get<InvoiceDto[]>('/invoices', { signal }),
  })
}

/** GET /invoices/{id}/pdf */
export function useInvoicePdf() {
  return useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient.getBlob(`/invoices/${encodeURIComponent(invoiceId)}/pdf`),
  })
}
