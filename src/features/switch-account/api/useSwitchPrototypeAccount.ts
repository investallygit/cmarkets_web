import { useMutation } from '@tanstack/react-query'
import { devToolsApi } from '@/shared/api/endpoints'
import { routes } from '@/shared/routes/paths'

/** Prototype helper (env.devTools): the back end switches account type to preview each screen. */
export function useSwitchPrototypeAccount() {
  return useMutation({
    mutationFn: devToolsApi.switchAccount,
    // Everything on screen depends on the account (caches, stores, subscriptions):
    // reload from /app, which then routes to the new account's home screen.
    onSuccess: () => window.location.assign(routes.app),
  })
}
