import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api'
import { mayRetry } from './retry'

const answer = (status: number) => new ApiError({ title: 'Answer', status })

describe('mayRetry (B07)', () => {
  it('offers no Retry for an answer the server gives again', () => {
    for (const status of [400, 403, 404, 410]) expect(mayRetry(answer(status))).toBe(false)
  })

  it('offers it for a timeout, a limit, a server error or no answer', () => {
    for (const status of [408, 429, 500, 503, 0]) expect(mayRetry(answer(status))).toBe(true)
    expect(mayRetry(new TypeError('Failed to fetch'))).toBe(true)
  })
})
