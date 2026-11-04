import type { AccessTokenDto, AccountType } from '@/shared/api/contracts'
import type { StoredAccount } from '../fixtures/accounts'
import { ACCESS_TOKEN_SECONDS, randomToken, REFRESH_TOKEN_MS } from '../lib/auth'
import { findAccount } from './accounts'
import {
  readStorage,
  removeStorage,
  sharedStore,
  storedArray,
  storedArrays,
  writeStorage,
} from './storage'

/**
 * Who the requests are answered for: the session of this tab, the refresh tokens behind the
 * cookie and the access tokens, and the stores of the current user's own data.
 */

let sessionUserId: string | null = null
/** A user is logged in, in this tab: a login or a refresh opens the session, a logout ends it. */
let sessionOpen = false

/** A login or a refresh: the user whose data the following requests are answered with. */
export function setSessionUser(userId: string | null): void {
  sessionUserId = userId
  sessionOpen = userId !== null
}

/** The user of the request being answered: the auth gate reads it from the access token. */
export function setRequestUser(userId: string): void {
  sessionUserId = userId
}

/**
 * A logout: nobody's alerts are watched until the next login. A request the auth gate already let
 * through is still answered for its user, though the logout ran while it waited for its latency.
 */
export function endSession(): void {
  sessionOpen = false
}

export function hasSession(): boolean {
  return sessionOpen
}

/** The account of the user logged in; the auth gate lets no request through without one. */
export function currentAccount(): StoredAccount {
  const account = sessionUserId ? findAccount(sessionUserId) : undefined
  if (!account) throw new Error('No session: the request did not go through the auth gate.')
  return account
}

export function currentAccountType(): AccountType {
  return currentAccount().accountType
}

/** Data of the current user. */
export function userStore<T extends object[]>(name: string, initial: () => T) {
  return storedArray(() => `cmarket.prototype.${name}.${currentAccount().id}`, initial)
}

/** Data of each user: the current user's, or a colleague's, such as a portfolio shared. */
export function usersStore<T extends object[]>(name: string, initial: (userId: string) => T) {
  const arrays = storedArrays((userId) => `cmarket.prototype.${name}.${userId}`, initial)
  return {
    read: (userId = currentAccount().id): T => arrays.read(userId),
    write: (value: T, userId = currentAccount().id) => arrays.write(userId, value),
  }
}

/** A refresh token: 7 days, unless a logout or a new password revokes it first. */
export interface StoredSession {
  token: string
  userId: string
  createdAt: number
  expiresAt: number
  revoked: boolean
}

export const sessionStore = sharedStore<StoredSession[]>('sessions', () => [])

const REFRESH_COOKIE_KEY = 'cmarket.prototype.refreshCookie'

/**
 * The HttpOnly cookie that carries the refresh token. The browser keeps it and scripts cannot
 * read it; the mock plays the browser's part, so the client code never touches it either.
 */
export const refreshCookie = {
  read: () => readStorage(REFRESH_COOKIE_KEY),
  write: (token: string | null) =>
    token ? writeStorage(REFRESH_COOKIE_KEY, token) : removeStorage(REFRESH_COOKIE_KEY),
}

/** Access tokens of this tab's mock, by value; a reload starts again from the cookie. */
const accessTokens = new Map<string, { userId: string; expiresAt: number }>()

export function issueAccessToken(userId: string): AccessTokenDto {
  const accessToken = `mock-access.${randomToken()}`
  accessTokens.set(accessToken, { userId, expiresAt: Date.now() + ACCESS_TOKEN_SECONDS * 1000 })
  return { accessToken, tokenType: 'Bearer', expiresIn: ACCESS_TOKEN_SECONDS }
}

/** The user of a valid access token. */
export function userOfAccessToken(token: string): string | null {
  const entry = accessTokens.get(token)
  if (!entry || entry.expiresAt <= Date.now()) return null
  return findAccount(entry.userId)?.status === 'active' ? entry.userId : null
}

/** A new refresh token for the user, set as the cookie. */
export function openSession(userId: string): void {
  const now = Date.now()
  const token = randomToken(32)
  const sessions = sessionStore.read().filter((session) => session.expiresAt > now)
  sessions.push({
    token,
    userId,
    createdAt: now,
    expiresAt: now + REFRESH_TOKEN_MS,
    revoked: false,
  })
  sessionStore.write(sessions)
  refreshCookie.write(token)
}

/** The session of the cookie, if still valid. */
export function cookieSession(): StoredSession | undefined {
  const token = refreshCookie.read()
  return sessionStore
    .read()
    .find(
      (session) => session.token === token && !session.revoked && session.expiresAt > Date.now(),
    )
}

/** POST /auth/logout: the refresh token is revoked and the cookie deleted. */
export function closeSession(): void {
  const token = refreshCookie.read()
  const sessions = sessionStore.read()
  sessions.forEach((session) => {
    if (session.token === token) session.revoked = true
  })
  sessionStore.write(sessions)
  refreshCookie.write(null)
}

/** A new password logs out the user's sessions: the others, or all after a reset. */
export function revokeSessions(userId: string, { keepCurrent }: { keepCurrent: boolean }): void {
  const token = keepCurrent ? refreshCookie.read() : null
  const sessions = sessionStore.read()
  sessions.forEach((session) => {
    if (session.userId === userId && session.token !== token) session.revoked = true
  })
  sessionStore.write(sessions)
  for (const [value, entry] of accessTokens) {
    if (entry.userId === userId && !keepCurrent) accessTokens.delete(value)
  }
}
