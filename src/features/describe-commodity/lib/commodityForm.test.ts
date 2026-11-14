import { describe, expect, it } from 'vitest'
import type { CommodityProfileDto, CommodityRelatedDto } from '@/shared/api/contracts'
import { initialCommodityForm, namesValid, toggleCountry } from './commodityForm'

const profile = {
  code: 'BRENT',
  nameEn: 'Brent crude oil (Europe)',
  nameFr: 'Pétrole brut Brent (Europe)',
  shortNameEn: 'Brent',
  shortNameFr: 'Brent',
  description: {
    en: { text: 'Brent is the benchmark.', source: 'dataAdmin', updatedAt: '2026-11-02T10:00:00Z' },
    fr: null,
  },
} as unknown as CommodityProfileDto

const related: CommodityRelatedDto = {
  countries: ['GA', 'CG'],
  securities: [
    {
      id: 'SIAT',
      code: 'SIAT',
      name: 'SIAT Gabon',
      type: 'equity',
      exchange: 'BVMAC',
      country: 'GA',
      currency: 'XAF',
    },
  ],
  news: [],
}

describe('the commodity form of CORR', () => {
  it('starts from the profile and its CEMAC links', () => {
    expect(initialCommodityForm(profile, related)).toEqual({
      nameEn: 'Brent crude oil (Europe)',
      nameFr: 'Pétrole brut Brent (Europe)',
      shortNameEn: 'Brent',
      shortNameFr: 'Brent',
      descriptionEn: 'Brent is the benchmark.',
      descriptionFr: '',
      countries: ['GA', 'CG'],
      securityIds: ['SIAT'],
    })
  })

  it('keeps every name, a list name of 32 characters at most', () => {
    const form = initialCommodityForm(profile, related)
    expect(namesValid(form)).toBe(true)
    expect(namesValid({ ...form, nameFr: '  ' })).toBe(false)
    expect(namesValid({ ...form, shortNameEn: 'x'.repeat(33) })).toBe(false)
  })

  it('keeps the countries in their order, a new one last', () => {
    expect(toggleCountry(['GA', 'CG', 'GQ', 'TD', 'CM'], 'CG')).toEqual(['GA', 'GQ', 'TD', 'CM'])
    expect(toggleCountry(['GA', 'CM'], 'CF')).toEqual(['GA', 'CM', 'CF'])
  })
})
