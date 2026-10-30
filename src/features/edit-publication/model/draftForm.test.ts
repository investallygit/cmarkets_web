import { describe, expect, it } from 'vitest'
import type { PublicationDto } from '@/shared/api/contracts'
import { textDoc } from '@/shared/lib/richText'
import {
  pricingIssues,
  readerPreview,
  submissionIssues,
  toDraftForm,
  toPricingDto,
  toUpdateDto,
} from './draftForm'

const RULES = {
  currency: 'XAF',
  minPrice: 2000,
  maxPrice: 100_000,
  commissionPct: 20,
  moderation: 'after',
} as const
const OPEN = { access: 'paid', readFree: false } as const

const publication: PublicationDto = {
  id: 'pub-semc-volumes',
  status: 'published',
  subjectType: 'company',
  subject: {
    type: 'company',
    id: 'SEMC',
    code: 'SEMC',
    name: 'Société des Eaux Minérales du Cameroun',
    country: 'CM',
    sector: 'Beverages',
    currency: 'XAF',
  },
  title: 'SEMC: volume growth supports the dividend',
  summary: 'Volumes sold are growing for the third year in a row.',
  body: textDoc([{ heading: '1. Growth driven by volumes' }, 'Revenue grew on volumes.']),
  rating: 'buy',
  targetPrice: 58_000,
  horizonMonths: 12,
  referenceDate: '2026-10-28',
  referencePrice: 52_500,
  dataDate: null,
  disclosures: { conflicts: true, disclaimer: true, sources: false },
  pricing: { access: 'paid', price: 15_000, studentPrice: 5000, freeAfterMonths: 3 },
  attachment: null,
  charts: [],
  readFree: false,
  versions: [{ number: 1, publishedAt: '2026-10-28T07:30:00Z' }],
  hasChanges: true,
  archiveReason: null,
  savedAt: '2026-10-30T09:41:00Z',
  version: 7,
}

describe('publication draft', () => {
  const form = toDraftForm(publication)

  it('sends the working copy with the row version it was read at', () => {
    expect(toUpdateDto(form, 7)).toMatchObject({
      subjectId: 'SEMC',
      targetPrice: 58_000,
      version: 7,
    })
    // A country has no target or horizon; a company no date of data.
    expect(
      toUpdateDto({ ...form, subjectType: 'country', dataDate: '2026-10-01' }, 7),
    ).toMatchObject({
      targetPrice: null,
      horizonMonths: null,
      dataDate: '2026-10-01',
    })
    expect(toPricingDto({ ...publication.pricing, access: 'free' }, 8)).toEqual({
      access: 'free',
      price: null,
      studentPrice: null,
      freeAfterMonths: null,
      version: 8,
    })
  })

  it('blocks the submission until every disclosure is ticked, as on screen 7', () => {
    expect(submissionIssues(form, publication.pricing, RULES, OPEN)).toEqual({
      disclosures: 'disclosuresRequired',
    })
    const ticked = { ...form, disclosures: { conflicts: true, disclaimer: true, sources: true } }
    expect(submissionIssues(ticked, publication.pricing, RULES, OPEN)).toEqual({})
    expect(
      submissionIssues(
        { ...ticked, subjectType: 'country', subjectId: null, title: '', rating: null },
        publication.pricing,
        RULES,
        OPEN,
      ),
    ).toEqual({
      subject: 'subjectRequired',
      title: 'titleRequired',
      rating: 'outlookRequired',
      dataDate: 'dataDateRequired',
    })
  })

  it('keeps the price in the range and a publication read for free free', () => {
    const pricing = publication.pricing
    expect(pricingIssues({ ...pricing, price: 1000, studentPrice: null }, RULES, OPEN)).toEqual({
      price: 'priceRange',
    })
    expect(pricingIssues({ ...pricing, studentPrice: 20_000 }, RULES, OPEN)).toEqual({
      studentPrice: 'studentBelow',
    })
    expect(pricingIssues(pricing, RULES, { access: 'free', readFree: true })).toEqual({
      access: 'readFree',
    })
  })

  it('previews the draft locked, then whole with the watermark', () => {
    const author = { id: 'analyst-atangana', displayName: 'K. Atangana' }
    const locked = readerPreview(publication, form, publication.pricing, author, false, 'now')
    expect(locked).toMatchObject({
      body: null,
      contents: ['1. Growth driven by volumes'],
      priceToPay: 15_000,
    })
    const open = readerPreview(publication, form, publication.pricing, author, true, 'now')
    expect(open.body).toBe(form.body)
    expect(open.watermark?.name).toBe('K. Atangana')
    expect(open.version).toBe(2)
    expect(open.versions.at(-1)).toEqual({ number: 2, publishedAt: 'now' })
  })
})
