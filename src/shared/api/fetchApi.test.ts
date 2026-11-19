import i18n from 'i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchApi, NO_RESPONSE } from './fetchApi'
import { ApiError } from './problem'

afterEach(async () => {
  vi.unstubAllGlobals()
  await i18n.changeLanguage('en')
})

const sentLanguage = (fetchMock: ReturnType<typeof vi.fn>) =>
  (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>

describe('fetchApi', () => {
  it("says in the user's language that the server is out of reach", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const failure = fetchApi('/api/v1/me', {})
    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({
      status: NO_RESPONSE,
      message: 'CMarket cannot be reached: check your connection, then retry.',
    })
  })

  it('leaves an abort as it is', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))
    await expect(fetchApi('/api/v1/me', {})).rejects.toBe(abort)
  })

  it('asks CMarket.Api to answer in the language the page shows', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await i18n.changeLanguage('fr')

    await fetchApi('/api/v1/me', { headers: { Accept: 'application/json' } })

    expect(sentLanguage(fetchMock)).toEqual({ 'Accept-Language': 'fr', Accept: 'application/json' })
  })

  it('follows the language switch, and keeps a language the request names itself', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await i18n.changeLanguage('en')

    await fetchApi('/api/v1/me', {})
    await fetchApi('/api/v1/me', { headers: { 'Accept-Language': 'fr' } })

    expect(sentLanguage(fetchMock)['Accept-Language']).toBe('en')
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toEqual({ 'Accept-Language': 'fr' })
  })
})
