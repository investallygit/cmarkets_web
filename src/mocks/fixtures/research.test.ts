import { describe, expect, it } from 'vitest'
import { researchMarket, securities } from '../db'
import { sumMonths } from '../lib/research'
import { analystProfile, libraryItem, mergeMonths, type ReaderContext } from '../lib/researchViews'
import { ANALYST_FIXTURES, ATANGANA, COUNTRY_NAMES, createLibrary } from './research'

describe('sample research library', () => {
  const market = researchMarket()
  const library = createLibrary(market)
  const context: ReaderContext = {
    today: market.today,
    user: { id: 'user-manager', displayName: 'P. Owona', accountType: 'manager', canBuy: true },
    security: (id) => securities.get(id),
    countryName: (code) => COUNTRY_NAMES[code],
    analyst: (id) => ANALYST_FIXTURES.find((analyst) => analyst.id === id),
    purchases: new Map(),
    reads: new Set(),
    myRatings: new Map(),
  }
  const published = library.filter((publication) => publication.status === 'published')

  it('lists the 128 publications of screen 8, the mockup lines first', () => {
    expect(published).toHaveLength(128)
    const items = published
      .flatMap((publication) => libraryItem(publication, context) ?? [])
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    expect(items).toHaveLength(128)
    expect(
      items.slice(0, 8).map((item) => [item.subject.code, item.access, item.price, item.score]),
    ).toEqual([
      ['SEMC', 'paid', 15_000, 4.6],
      ['CM', 'paid', 25_000, 4.4],
      ['BANGE', 'free', null, 4.1],
      ['GA', 'paid', 20_000, 4.7],
      ['SCG-RE', 'free', null, 3.9],
      ['SAFACAM', 'paid', 10_000, 4.2],
      ['REGIONALE', 'paid', 12_000, 4.5],
      ['CG', 'free', null, 4.0],
    ])
  })

  it('gives K. Atangana the profile of screen 8: 42 publications, 4.4 / 5, 68% confirmed', () => {
    const atangana = ANALYST_FIXTURES.find((analyst) => analyst.id === ATANGANA)!
    const profile = analystProfile(atangana, library, {
      today: market.today,
      security: (id) => securities.get(id),
      closeOn: market.closeOn,
      isFollowed: false,
      isSelf: false,
    })
    expect(profile).toMatchObject({
      publications: 42,
      score: 4.4,
      followers: 412,
      confirmedPct: 68,
    })
  })

  it('earns K. Atangana the October of screen 7', () => {
    const mine = library.filter((publication) => publication.analystId === ATANGANA)
    expect(mine).toHaveLength(44)
    const october = sumMonths(mergeMonths(mine), '2026-10', '2026-10')
    expect(october).toMatchObject({ reads: 3412, sales: 58, revenue: 1_120_000, starCount: 37 })
    expect(Math.round((october.starSum / october.starCount) * 10) / 10).toBe(4.4)
  })

  it('has the SEMC update of screen 7 in progress, its chart frozen on 28/10/2026', () => {
    const semc = library.find((publication) => publication.id === 'pub-semc-volumes')!
    expect(semc.versions).toHaveLength(1)
    expect(semc.draft.disclosures).toEqual({ conflicts: true, disclaimer: true, sources: false })
    expect(semc.charts[0]).toMatchObject({ frozenAt: '2026-10-28', period: '1Y' })
    expect(semc.charts[0].bars.at(-1)?.time.slice(0, 10)).toBe('2026-10-28')
  })
})
