import { beforeEach, describe, expect, it } from 'vitest'
import type { ProviderNewsDto } from '@/shared/api/contracts'
import { isNewsDirty, useNewsDraftStore } from './newsDraftStore'

const item = (patch: Partial<ProviderNewsDto> = {}): ProviderNewsDto => ({
  id: 'n-1',
  type: 'article',
  status: 'draft',
  headline: 'BEAC',
  publishedAt: null,
  publishAt: null,
  withdrawnAt: null,
  updatedAt: '2026-10-29T06:00:00Z',
  summary: '',
  body: null,
  category: null,
  countries: [],
  securityIds: [],
  language: 'en',
  subject: null,
  author: null,
  originalUrl: null,
  attachment: null,
  editedAt: null,
  rightsConfirmedAt: null,
  withdrawalReason: null,
  externalId: null,
  version: 1,
  ...patch,
})

const draft = () => useNewsDraftStore.getState().draft!

describe('the item open in the studio', () => {
  beforeEach(() => useNewsDraftStore.setState({ draft: null }))

  it('counts the edits until a save brings the server copy and its version', () => {
    useNewsDraftStore.getState().open(item())
    expect(draft().rightsConfirmed).toBe(false)
    useNewsDraftStore.getState().edit({ headline: 'BEAC holds its rates' })
    expect(isNewsDirty(draft())).toBe(true)

    useNewsDraftStore
      .getState()
      .saved('n-1', item({ headline: 'BEAC holds its rates', version: 2 }), 1)
    expect(isNewsDirty(draft())).toBe(false)
    expect(draft().version).toBe(2)
  })

  it('keeps the edits when the server copy is read again, and starts again from it otherwise', () => {
    useNewsDraftStore.getState().open(item())
    const generation = draft().generation
    useNewsDraftStore.getState().edit({ headline: 'Mine' })
    // The scheduled item went live meanwhile: its status follows, the edit stays.
    useNewsDraftStore.getState().refresh(item({ status: 'published', version: 3 }))
    expect(draft().item.status).toBe('published')
    expect(draft().form.headline).toBe('Mine')
    expect(draft().version).toBe(1)

    useNewsDraftStore.getState().saved('n-1', item({ headline: 'Mine', version: 4 }), 1)
    useNewsDraftStore.getState().refresh(item({ headline: 'Another tab', version: 5 }))
    expect(draft().form.headline).toBe('Another tab')
    expect(draft().generation).toBeGreaterThan(generation)
  })

  it('takes a published item as stating its rights, and a scheduled one at its time of Douala', () => {
    useNewsDraftStore.getState().open(
      item({
        status: 'scheduled',
        publishAt: '2026-10-30T07:00:00Z',
        rightsConfirmedAt: '2026-10-29T06:00:00Z',
      }),
    )
    expect(draft().rightsConfirmed).toBe(true)
    expect(draft().goLive).toEqual({ mode: 'scheduled', date: '2026-10-30', time: '08:00' })
  })
})
