import { env } from '@/shared/config/env'
import type { AccessTokenDto } from './contracts'
import { fetchApi } from './fetchApi'
import { ApiError, readProblem } from './problem'

/**
 * The user's session (spec section 10): a JWT access token valid 15 minutes, kept in memory only,
 * and a refresh token valid 7 days that the server sets as an HttpOnly cookie on /auth. Scripts
 * never see the refresh token: POST /auth/refresh trades the cookie for a new access token, at
 * start-up and whenever the access token runs out. The tabs of a browser log out together.
 */

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'

/** Why the last session ended, for the login page to say so. */
export type SessionEndReason = 'logout' | 'expired' | 'inactivity'

export interface SessionState {
  status: SessionStatus
  endReason: SessionEndReason | null
}

/** A token this close to its expiry is renewed before a request leaves with it. */
const EXPIRY_MARGIN_MS = 30_000

type SessionMessage = { type: 'login' } | { type: 'logout'; reason: SessionEndReason }

let token: { value: string; expiresAt: number } | null = null
let state: SessionState = { status: 'unknown', endReason: null }
let refreshing: Promise<string | null> | null = null
const listeners = new Set<(state: SessionState) => void>()

const channel =
  typeof BroadcastChannel === 'function' ? new BroadcastChannel('cmarket.session') : null

channel?.addEventListener('message', (event: MessageEvent<SessionMessage>) => {
  const message = event.data
  if (message.type === 'logout') {
    token = null
    setState({ status: 'anonymous', endReason: message.reason })
  } else if (state.status === 'authenticated') {
    // Someone else logged in with this browser: start again with their session.
    window.location.reload()
  } else {
    void refreshAccessToken().catch(() => undefined)
  }
})

function setState(next: SessionState): void {
  if (next.status === state.status && next.endReason === state.endReason) return
  state = next
  listeners.forEach((listener) => listener(state))
}

function keep(dto: AccessTokenDto): void {
  token = { value: dto.accessToken, expiresAt: Date.now() + dto.expiresIn * 1000 }
}

export function getSessionState(): SessionState {
  return state
}

/** Called on every change of status; returns the function that stops listening. */
export function onSessionChange(listener: (state: SessionState) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** After POST /auth/otp/verify: the user is in, and the other tabs follow. */
export function startSession(dto: AccessTokenDto): void {
  keep(dto)
  setState({ status: 'authenticated', endReason: null })
  channel?.postMessage({ type: 'login' } satisfies SessionMessage)
}

/** Forgets the access token. A logout, by the user or for inactivity, ends the other tabs too. */
export function endSession(reason: SessionEndReason): void {
  token = null
  if (state.status === 'anonymous') return
  setState({ status: 'anonymous', endReason: reason })
  if (reason !== 'expired')
    channel?.postMessage({ type: 'logout', reason } satisfies SessionMessage)
}

async function requestRefresh(): Promise<string | null> {
  const response = await fetchApi(`${env.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  if (response.status === 401) {
    token = null
    // An open session has expired; at start-up, there was none to restore.
    setState({
      status: 'anonymous',
      endReason: state.status === 'authenticated' ? 'expired' : state.endReason,
    })
    return null
  }
  // Server down or unreachable: the session may still be valid, so it is kept.
  if (!response.ok) throw new ApiError(await readProblem(response))
  const dto = (await response.json()) as AccessTokenDto
  keep(dto)
  setState({ status: 'authenticated', endReason: null })
  return dto.accessToken
}

/** POST /auth/refresh, once at a time however many requests need it; null without a session. */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= requestRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

/** The access token to send, renewed first when missing or about to expire. */
export async function getAccessToken(): Promise<string | null> {
  if (token && token.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return token.value
  if (state.status === 'anonymous') return null
  return refreshAccessToken()
}
