import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccessTokenDto } from './contracts'

type Session = typeof import('./session')
type Client = typeof import('./client')

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const token = (value: string): AccessTokenDto => ({
  accessToken: value,
  tokenType: 'Bearer',
  expiresIn: 900,
})

/** Each test starts without a session: the module state is loaded afresh. */
async function load(): Promise<Session & Client> {
  vi.resetModules()
  return { ...(await import('./session')), ...(await import('./client')) }
}

describe('session of the API client', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    // One module per test: without a channel, the earlier ones hear nothing (e2e tests the tabs).
    vi.stubGlobal('BroadcastChannel', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const calls = () => fetchMock.mock.calls.map(([url]) => String(url).replace(/^.*\/api\/v1/, ''))
  const authorization = (index: number) =>
    (fetchMock.mock.calls[index][1]?.headers as Record<string, string> | undefined)?.Authorization

  it('restores the session from the cookie once, however many requests wait for it', async () => {
    const session = await load()
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith('/auth/refresh') ? json(token('first')) : json({ ok: true }),
    )
    await Promise.all([session.apiClient.get('/me'), session.apiClient.get('/market/status')])
    expect(calls().filter((url) => url === '/auth/refresh')).toHaveLength(1)
    expect(authorization(1)).toBe('Bearer first')
    expect(session.getSessionState()).toEqual({ status: 'authenticated', endReason: null })
  })

  it('renews a token refused before its time, then sends the request again', async () => {
    const session = await load()
    session.startSession(token('revoked'))
    fetchMock
      .mockResolvedValueOnce(json({ title: 'Unauthorized', status: 401 }, 401))
      .mockResolvedValueOnce(json(token('renewed')))
      .mockResolvedValueOnce(json({ id: 'user-analyst' }))
    await expect(session.apiClient.get('/me')).resolves.toEqual({ id: 'user-analyst' })
    expect(calls()).toEqual(['/me', '/auth/refresh', '/me'])
    expect(authorization(0)).toBe('Bearer revoked')
    expect(authorization(2)).toBe('Bearer renewed')
  })

  it('ends the session when the refresh token is refused too', async () => {
    const session = await load()
    session.startSession(token('old'))
    fetchMock.mockImplementation(async () => json({ title: 'Unauthorized', status: 401 }, 401))
    await expect(session.apiClient.get('/me')).rejects.toMatchObject({ status: 401 })
    expect(session.getSessionState()).toEqual({ status: 'anonymous', endReason: 'expired' })
  })

  it('opens the login page at start-up without a cookie, without saying a session expired', async () => {
    const session = await load()
    fetchMock.mockResolvedValueOnce(json({ title: 'No session', status: 401 }, 401))
    await expect(session.refreshAccessToken()).resolves.toBeNull()
    expect(session.getSessionState()).toEqual({ status: 'anonymous', endReason: null })
  })

  it('keeps the session when the server cannot be reached', async () => {
    const session = await load()
    fetchMock.mockResolvedValueOnce(json({ title: 'Bad gateway', status: 502 }, 502))
    await expect(session.refreshAccessToken()).rejects.toMatchObject({ status: 502 })
    expect(session.getSessionState().status).toBe('unknown')
  })

  it('sends the login calls without a token, cookie included', async () => {
    const session = await load()
    fetchMock.mockResolvedValueOnce(json({ challengeId: 'challenge-1' }))
    await session.apiClient.post(
      '/auth/login',
      { email: 'a@b.cm', password: 'x' },
      { anonymous: true },
    )
    expect(calls()).toEqual(['/auth/login'])
    expect(authorization(0)).toBeUndefined()
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include')
  })

  it('keeps a request alive when asked: a save as the page goes away', async () => {
    const client = await load()
    client.startSession(token('value'))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await client.apiClient.put('/me/layouts/MKT', { items: [] }, { keepalive: true })
    expect(fetchMock.mock.calls[0][1]?.keepalive).toBe(true)
  })

  it('says why the session ended', async () => {
    const session = await load()
    const listener = vi.fn()
    session.onSessionChange(listener)
    session.startSession(token('value'))
    session.endSession('inactivity')
    expect(listener).toHaveBeenLastCalledWith({ status: 'anonymous', endReason: 'inactivity' })
    await expect(session.getAccessToken()).resolves.toBeNull()
  })
})
