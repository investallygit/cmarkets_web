import type { AccountType } from '../contracts'
import { answer, route, send } from './define'

/** The demo user of each account type and their password. */
export interface DemoAccountsDto {
  password: string
  accounts: { accountType: AccountType; email: string; displayName: string }[]
}

/** The code a login challenge, or the latest password reset of an address, would have sent. */
export type SentCodeQuery = { challengeId: string } | { email: string; sentAt: number }

/**
 * The prototype's helpers (env.devTools), under /_prototype: served by the mock and by
 * CMarket.Api/Controllers/DevTools in development only, and missing from its OpenAPI document.
 */
const devOnly = { devOnly: true }

export const devToolsRoutes = {
  accounts: route('GET', '/_prototype/accounts', answer<DemoAccountsDto>(), devOnly),
  codes: route('GET', '/_prototype/codes', answer<{ code: string }>(), devOnly),
  /** The account switch: a session for the demo user of the type, as its refresh cookie. */
  session: route('PUT', '/_prototype/session', undefined, devOnly),
}

const anonymous = true

export const devToolsApi = {
  accounts: (signal?: AbortSignal) => send(devToolsRoutes.accounts, { signal, anonymous }),
  sentCode: (query: SentCodeQuery, signal?: AbortSignal) =>
    send(devToolsRoutes.codes, { query, signal, anonymous }),
  switchAccount: (accountType: AccountType) =>
    send(devToolsRoutes.session, { body: { accountType } }),
}
