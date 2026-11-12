import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import type {
  AdminSubscriptionQuery,
  SubscriptionExtendDto,
  SubscriptionPlanWriteDto,
} from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'

/** SUBS shows 14 rows on its mockup; the API's page is the list's. */
export const SUBSCRIPTIONS_PAGE_SIZE = 50

/** SUBS's data, under the Admin's keys: an Admin action asks them all again. */
export const subscriptionAdminKeys = {
  all: [...ADMIN_QUERY_ROOT, 'subscriptions'] as const,
  list: (query: AdminSubscriptionQuery) => [...subscriptionAdminKeys.all, 'list', query] as const,
  stats: () => [...subscriptionAdminKeys.all, 'stats'] as const,
  plans: () => [...subscriptionAdminKeys.all, 'plans'] as const,
  details: (accountId: string) => [...subscriptionAdminKeys.all, 'details', accountId] as const,
  payments: (accountId: string) => [...subscriptionAdminKeys.all, 'payments', accountId] as const,
  proration: (accountId: string, change: SubscriptionPlanWriteDto) =>
    [...subscriptionAdminKeys.all, 'proration', accountId, change] as const,
}

/** GET /admin/subscriptions: a page of the accounts and the organisations that pay. */
export function useAdminSubscriptions(query: AdminSubscriptionQuery) {
  return useQuery({
    queryKey: subscriptionAdminKeys.list(query),
    queryFn: ({ signal }) =>
      adminApi.subscriptions({ pageSize: SUBSCRIPTIONS_PAGE_SIZE, ...query }, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /admin/subscriptions/stats: SUBS's counters. */
export function useSubscriptionStats() {
  return useQuery({
    queryKey: subscriptionAdminKeys.stats(),
    queryFn: ({ signal }) => adminApi.subscriptionStats(signal),
  })
}

/** GET /admin/subscriptions/plans: the catalogue, the plan given by agreement included. */
export function useAdminPlans() {
  return useQuery({
    queryKey: subscriptionAdminKeys.plans(),
    queryFn: ({ signal }) => adminApi.subscriptionPlans(signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /admin/subscriptions/{accountId}: the subscription that covers the account. */
export function useAdminSubscription(accountId: string | null) {
  return useQuery({
    queryKey: subscriptionAdminKeys.details(accountId ?? ''),
    queryFn: ({ signal }) => adminApi.subscription(accountId ?? '', signal),
    enabled: accountId !== null,
  })
}

/** GET /admin/subscriptions/{accountId}/payments: the invoices and the charges without one. */
export function useSubscriptionPayments(accountId: string | null) {
  return useQuery({
    queryKey: subscriptionAdminKeys.payments(accountId ?? ''),
    queryFn: ({ signal }) => adminApi.subscriptionPayments(accountId ?? '', signal),
    enabled: accountId !== null,
  })
}

/** GET /admin/subscriptions/{accountId}/proration: a change of plan as it would be made today. */
export function usePlanChangeProration(accountId: string, change: SubscriptionPlanWriteDto | null) {
  return useQuery({
    queryKey: subscriptionAdminKeys.proration(
      accountId,
      change ?? { planId: '', billingCycle: 'yearly' },
    ),
    queryFn: ({ signal }) =>
      adminApi.planChangeProration(
        accountId,
        change ?? { planId: '', billingCycle: 'yearly' },
        signal,
      ),
    enabled: change !== null,
    retry: false,
  })
}

/** GET /admin/subscriptions/export: every row of the filters as CSV, not only the page shown. */
export function useExportSubscriptions() {
  return useMutation({ mutationFn: adminApi.exportSubscriptions })
}

/** GET /admin/invoices/{id}/pdf: an invoice of any payer. */
export function useAdminInvoicePdf() {
  return useMutation({ mutationFn: adminApi.invoicePdf })
}

/** PUT /admin/subscriptions/{accountId}/plan: prorated by the day, as the preview showed. */
export function useChangeSubscriptionPlan() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ accountId, change }: { accountId: string; change: SubscriptionPlanWriteDto }) =>
      adminApi.changeSubscriptionPlan(accountId, change),
    onSuccess: refresh,
  })
}

/** POST /admin/subscriptions/{accountId}/extend: to a later day, free of charge, with a reason. */
export function useExtendSubscription() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({
      accountId,
      extension,
    }: {
      accountId: string
      extension: SubscriptionExtendDto
    }) => adminApi.extendSubscription(accountId, extension),
    onSuccess: refresh,
  })
}

/** POST /admin/subscriptions/{accountId}/suspend, or /reactivate to lift it; a reason either way. */
export function useSuspendSubscription() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({
      accountId,
      suspend,
      reason,
    }: {
      accountId: string
      suspend: boolean
      reason: string
    }) =>
      suspend
        ? adminApi.suspendSubscription(accountId, reason)
        : adminApi.reactivateSubscription(accountId, reason),
    onSuccess: refresh,
  })
}

/** POST /admin/invoices/{id}/resend: the invoice e-mailed again to its payer. */
export function useResendInvoice() {
  const refresh = useRefreshAdminData()
  return useMutation({ mutationFn: adminApi.resendInvoice, onSuccess: refresh })
}
