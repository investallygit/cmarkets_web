import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../client'
import { answer, fillPath, route, send, sendBlob, sendForm } from './define'

afterEach(() => vi.restoreAllMocks())

describe('fillPath', () => {
  it('fills and encodes each parameter', () => {
    expect(
      fillPath('/watchlists/{id}/items/{securityId}', { id: 'W 1', securityId: 'SG/RE' }),
    ).toBe('/watchlists/W%201/items/SG%2FRE')
  })

  it('refuses a path with a parameter missing', () => {
    expect(() => fillPath('/watchlists/{id}', {})).toThrow('Missing {id} for /watchlists/{id}')
  })
})

describe('send', () => {
  const update = route('PUT', '/watchlists/{id}', answer<{ id: string }>())

  it('sends the method, the filled path, the body and the options to the client', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 'w1' })
    const signal = new AbortController().signal

    const answered = await send(update, { params: { id: 'w1' }, body: { name: 'Banks' }, signal })

    expect(answered).toEqual({ id: 'w1' })
    expect(put).toHaveBeenCalledWith('/watchlists/w1', { name: 'Banks' }, { signal })
  })

  it('takes no options for a path without parameter', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue([])
    await send(route('GET', '/watchlists', answer<unknown[]>()))
    expect(get).toHaveBeenCalledWith('/watchlists', {})
  })

  it('types the parameters of the path', () => {
    // @ts-expect-error: {id} is required
    expect(() => send(update, {})).toThrow('Missing {id}')
  })

  it('sends a form and reads a file', async () => {
    const postForm = vi.spyOn(apiClient, 'postForm').mockResolvedValue({ ok: true })
    const getBlob = vi.spyOn(apiClient, 'getBlob').mockResolvedValue(new Blob(['%PDF']))
    const form = new FormData()

    await sendForm(route('POST', '/publications/{id}/attachments'), form, { params: { id: 'p1' } })
    await sendBlob(route('GET', '/invoices/{id}/pdf', answer<Blob>()), { params: { id: 'i1' } })

    expect(postForm).toHaveBeenCalledWith('/publications/p1/attachments', form, {})
    expect(getBlob).toHaveBeenCalledWith('/invoices/i1/pdf', {
      query: undefined,
      signal: undefined,
    })
  })
})
