import { describe, expect, it } from 'vitest'
import type { LibraryItemDto } from '@/shared/api/contracts'
import { estimatePages, textDoc } from '@/shared/lib/richText'
import {
  accessOn,
  matchesLibraryFilter,
  paydayOf,
  payoutsOf,
  pricingErrors,
  ratingOutcome,
  scoreOf,
  sortLibrary,
  submissionErrors,
  type StoredContent,
} from './research'

const RULES = {
  currency: 'XAF',
  minPrice: 2000,
  maxPrice: 100_000,
  commissionPct: 20,
  moderation: 'after',
} as const
const PAID = { access: 'paid', price: 15_000, studentPrice: 5000, freeAfterMonths: 3 } as const
const OPEN = { access: 'paid', readFree: false } as const

const content: StoredContent = {
  subjectType: 'company',
  subjectId: 'SEMC',
  title: 'SEMC: volume growth supports the dividend',
  summary: 'Volumes sold are growing for the third year in a row.',
  body: textDoc([{ heading: '1. Growth driven by volumes' }, 'Revenue grew on volumes.']),
  rating: 'buy',
  targetPrice: 58_000,
  horizonMonths: 12,
  referenceDate: '2026-10-28',
  referencePrice: 52_500,
  dataDate: null,
  disclosures: { conflicts: true, disclaimer: true, sources: true },
}

describe('research rules (spec section 13)', () => {
  it('turns a paid publication free after the months set', () => {
    expect(accessOn(PAID, '2026-07-28T07:30:00Z', '2026-10-27')).toBe('paid')
    expect(accessOn(PAID, '2026-07-28T07:30:00Z', '2026-10-28')).toBe('free')
    expect(accessOn({ ...PAID, freeAfterMonths: null }, '2020-01-01T00:00:00Z', '2026-10-28')).toBe(
      'paid',
    )
  })

  it('keeps prices within the range, and a publication read for free free', () => {
    expect(pricingErrors(PAID, RULES, OPEN)).toEqual({})
    expect(pricingErrors({ ...PAID, price: 150_000 }, RULES, OPEN)).toEqual({
      price: ['Between XAF 2,000 and 100,000.'],
    })
    expect(pricingErrors({ ...PAID, studentPrice: 15_000 }, RULES, OPEN)).toEqual({
      studentPrice: ['Below the price.'],
    })
    expect(pricingErrors(PAID, RULES, { access: 'free', readFree: true }).access).toBeDefined()
    // Paid to free is always allowed.
    expect(
      pricingErrors(
        { access: 'free', price: null, studentPrice: null, freeAfterMonths: null },
        RULES,
        {
          access: 'paid',
          readFree: true,
        },
      ),
    ).toEqual({})
  })

  it('checks a submission: subject, texts, rating and every disclosure', () => {
    expect(submissionErrors(content, PAID, RULES, OPEN)).toEqual({})
    const errors = submissionErrors(
      {
        ...content,
        subjectType: 'country',
        subjectId: null,
        title: ' ',
        rating: null,
        disclosures: { conflicts: true, disclaimer: true, sources: false },
      },
      PAID,
      RULES,
      OPEN,
    )
    expect(Object.keys(errors).sort()).toEqual([
      'dataDate',
      'disclosures',
      'rating',
      'subject',
      'title',
    ])
  })

  it('scores a Buy, a Sell and a Hold against the price 12 months later', () => {
    expect(ratingOutcome('buy', 3.2, true)).toBe('confirmed')
    expect(ratingOutcome('buy', -0.5, true)).toBe('missed')
    expect(ratingOutcome('sell', -12, true)).toBe('confirmed')
    expect(ratingOutcome('hold', 9.9, true)).toBe('confirmed')
    expect(ratingOutcome('hold', -10.1, true)).toBe('missed')
    expect(ratingOutcome('buy', 40, false)).toBe('open')
  })

  it('averages ratings to one decimal and counts pages', () => {
    expect(scoreOf({ starSum: 55, starCount: 12 })).toBe(4.6)
    expect(scoreOf({ starSum: 0, starCount: 0 })).toBeNull()
    expect(estimatePages(content.summary, content.body)).toBe(1)
    const long = textDoc(Array.from({ length: 100 }, () => 'word '.repeat(10)))
    expect(estimatePages('', long)).toBe(3)
  })

  it('owes each closed month, less the commission, until the Admin marks it paid', () => {
    const month = { reads: 10, sales: 2, revenue: 30_000, starSum: 0, starCount: 0 }
    const payouts = payoutsOf(
      { '2026-08': month, '2026-09': month, '2026-10': month, '2026-07': { ...month, sales: 0 } },
      20,
      '2026-10-04',
      new Map([['2026-08', paydayOf('2026-08')]]),
    )
    expect(payouts.map((payout) => [payout.month, payout.status, payout.net])).toEqual([
      ['2026-10', 'accruing', 24_000],
      ['2026-09', 'due', 24_000],
      ['2026-08', 'paid', 24_000],
    ])
    expect(payouts[2].paidAt).toBe('2026-09-05')
  })
})

describe('library list', () => {
  const item = (id: string, overrides: Partial<LibraryItemDto>): LibraryItemDto => ({
    id,
    title: `Note ${id}`,
    subject: {
      type: 'company',
      id: 'SEMC',
      code: 'SEMC',
      name: 'Société des Eaux Minérales du Cameroun',
      country: 'CM',
      sector: 'Beverages',
      currency: 'XAF',
    },
    analyst: { id: 'analyst-atangana', displayName: 'K. Atangana' },
    publishedAt: '2026-10-01T07:30:00Z',
    updatedAt: null,
    access: 'paid',
    price: 10_000,
    studentPrice: null,
    rating: 'buy',
    targetPrice: null,
    score: 4,
    scoreCount: 3,
    reads: 10,
    status: 'published',
    purchasedAt: null,
    isRead: false,
    ...overrides,
  })

  it('filters by subject, access, rating and words of the title, code, name or analyst', () => {
    const semc = item('a', {})
    expect(matchesLibraryFilter(semc, { q: 'eaux atang' })).toBe(true)
    expect(matchesLibraryFilter(semc, { q: 'gabon' })).toBe(false)
    expect(matchesLibraryFilter(semc, { access: 'free' })).toBe(false)
    expect(matchesLibraryFilter(semc, { country: 'CM', sector: 'Beverages', rating: 'buy' })).toBe(
      true,
    )
    expect(matchesLibraryFilter(semc, { analystIds: new Set(['analyst-ndong']) })).toBe(false)
  })

  it('sorts by the latest version, the rating, the readers or the price, free first', () => {
    const items = [
      item('old', {
        publishedAt: '2026-09-01T07:30:00Z',
        score: 4.8,
        reads: 5,
        access: 'free',
        price: null,
      }),
      item('updated', {
        publishedAt: '2026-08-01T07:30:00Z',
        updatedAt: '2026-10-20T07:30:00Z',
        price: 5000,
      }),
      item('new', { publishedAt: '2026-10-10T07:30:00Z', reads: 50, price: 2000 }),
    ]
    expect(sortLibrary(items, 'recent').map((entry) => entry.id)).toEqual(['updated', 'new', 'old'])
    expect(sortLibrary(items, 'rating').map((entry) => entry.id)).toEqual(['old', 'updated', 'new'])
    expect(sortLibrary(items, 'reads').map((entry) => entry.id)).toEqual(['new', 'updated', 'old'])
    expect(sortLibrary(items, 'price').map((entry) => entry.id)).toEqual(['old', 'new', 'updated'])
  })
})
