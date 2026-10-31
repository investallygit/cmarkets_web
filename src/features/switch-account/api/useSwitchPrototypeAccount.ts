import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { AccountType } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'

/** Prototype only: the mock back end switches account type to preview each menu and screen. */
export function useSwitchPrototypeAccount() {
  return useMutation({
    mutationFn: (accountType: AccountType) =>
      apiClient.put<void>('/_prototype/session', { accountType }),
    // Everything on screen depends on the account (caches, stores, subscriptions):
    // reload from /app, which then routes to the new account's home screen.
    onSuccess: () => window.location.assign(routes.app),
  })
}
