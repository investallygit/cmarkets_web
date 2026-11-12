import { describe, expect, it } from 'vitest'
import { defaultCriteria, fromSaved, toQuery, toSaved, type EtfCriteria } from './criteria'

const none: EtfCriteria = {
  assetClass: null,
  subCategory: null,
  geographies: [],
  sector: null,
  provider: null,
  exchange: null,
  ytdMin: null,
  sharpeMin: null,
  terMax: null,
  ucitsOnly: false,
  accumulatingOnly: false,
  hedgedOnly: false,
}

describe('ETFS criteria (screen 15)', () => {
  it('asks for the mockup screen on every ETF of one page', () => {
    expect(toQuery(defaultCriteria())).toEqual({
      pageSize: 200,
      assetClass: 'equity',
      geography: 'global,us',
      ucits: true,
      terMax: 0.25,
      ytdMin: 8,
      sharpeMin: 1,
    })
  })

  it('leaves out what is not set, and asks for the kind of fund a box keeps', () => {
    expect(toQuery(none)).toEqual({ pageSize: 200 })
    expect(
      toQuery({
        ...none,
        accumulatingOnly: true,
        hedgedOnly: true,
        exchange: 'XETRA',
        provider: 'BlackRock',
      }),
    ).toEqual({
      pageSize: 200,
      distribution: 'accumulating',
      hedged: true,
      exchange: 'XETRA',
      provider: 'BlackRock',
    })
  })

  it('keeps a screen as lists and loads it back, the first of a list in its drop-down', () => {
    const saved = toSaved({
      ...defaultCriteria(),
      sector: 'technology',
      subCategory: 'US technology',
    })
    expect(saved).toEqual({
      assetClasses: ['equity'],
      subCategories: ['US technology'],
      geographies: ['global', 'us'],
      sectors: ['technology'],
      providers: [],
      exchanges: [],
      ytdMin: 8,
      sharpeMin: 1,
      terMax: 0.25,
      ucitsOnly: true,
      accumulatingOnly: false,
      hedgedOnly: false,
    })
    expect(fromSaved(saved)).toEqual({
      ...defaultCriteria(),
      sector: 'technology',
      subCategory: 'US technology',
    })
    expect(
      fromSaved({ ...saved, assetClasses: ['fixedIncome', 'equity'], sectors: [] }).assetClass,
    ).toBe('fixedIncome')
  })
})
