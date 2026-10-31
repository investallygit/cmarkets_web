import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchApi, NO_RESPONSE } from './fetchApi'
import { ApiError } from './problem'

afterEach(() => {
  vi.unstubAllGlobals()
})

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
})
