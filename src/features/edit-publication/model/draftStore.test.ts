import { beforeEach, describe, expect, it } from 'vitest'
import type { PublicationDto } from '@/shared/api/contracts'
import { textDoc } from '@/shared/lib/richText'
import { isDirty, isEditable, useDraftStore } from './draftStore'

const publication: PublicationDto = {
  id: 'pub-1',
  status: 'draft',
  subjectType: 'company',
  subject: null,
  title: '',
  summary: '',
  body: textDoc([]),
  rating: null,
  targetPrice: null,
  horizonMonths: 12,
  referenceDate: null,
  referencePrice: null,
  dataDate: null,
  disclosures: { conflicts: false, disclaimer: false, sources: false },
  pricing: { access: 'free', price: null, studentPrice: null, freeAfterMonths: null },
  attachment: null,
  charts: [],
  readFree: false,
  versions: [],
  hasChanges: false,
  archiveReason: null,
  savedAt: '2026-10-30T09:00:00Z',
  version: 1,
}

const draft = () => useDraftStore.getState().draft!

describe('draft store', () => {
  beforeEach(() => useDraftStore.getState().open(publication))

  it('counts edits until the server has them', () => {
    const store = useDraftStore.getState()
    store.edit({ title: 'SEMC' })
    store.edit({ title: 'SEMC: volumes' })
    store.editPricing({ access: 'paid' })
    expect(isDirty(draft())).toBe(true)
    // Saved after the second edit of the title: a third one made meanwhile stays to send.
    store.edit({ title: 'SEMC: volumes up' })
    store.saved(
      'pub-1',
      { ...publication, version: 2, savedAt: '2026-10-30T09:00:10Z' },
      {
        content: 2,
        pricing: 1,
      },
    )
    expect(draft()).toMatchObject({ version: 2, savedContentEdits: 2, contentEdits: 3 })
    expect(isDirty(draft())).toBe(true)
  })

  it('ignores the answer about a publication left meanwhile', () => {
    useDraftStore.getState().saved('pub-other', { ...publication, id: 'pub-other', version: 9 }, {})
    expect(draft().version).toBe(1)
  })

  it('keeps the server errors of the fields not changed since', () => {
    const store = useDraftStore.getState()
    store.rejected('pub-1', {
      title: ['Give a title.'],
      subject: ['Choose the company.'],
      price: ['Set the price.'],
    })
    store.edit({ subjectId: 'SEMC', subjectCode: 'SEMC' })
    store.editPricing({ price: 15_000 })
    expect(draft().serverErrors).toEqual({ title: ['Give a title.'] })
  })

  it('does not send refused edits again until they change', () => {
    const store = useDraftStore.getState()
    store.edit({ title: 'x'.repeat(200) })
    store.failed('pub-1', 'invalid', { title: ['At most 160 characters.'] })
    expect(draft().failedEdits).toBe(1)
    expect(isEditable(draft())).toBe(true)
    expect(isEditable({ status: 'pending' })).toBe(false)
  })
})
