import { describe, expect, it } from 'vitest'
import type { DescriptionTextDto, SecurityDescriptionDto } from '@/shared/api/contracts'
import { shownDescription } from './description'

const text = (value: string, source: DescriptionTextDto['source'] = 'dataAdmin') => ({
  text: value,
  source,
  updatedAt: '2026-11-12T08:30:00Z',
})

describe('shownDescription (spec section 9, screen 3; ROADMAP decision 9)', () => {
  const both: SecurityDescriptionDto = { fr: text('Eau minérale.'), en: text('Mineral water.') }

  it('shows the language wanted, with a choice between the two written', () => {
    expect(shownDescription(both, 'fr')).toEqual({
      language: 'fr',
      text: 'Eau minérale.',
      source: 'dataAdmin',
      languages: ['fr', 'en'],
    })
    expect(shownDescription(both, 'en')?.text).toBe('Mineral water.')
  })

  it('stands in the other language where the one wanted has no text', () => {
    const english = { fr: null, en: text('From EODHD.', 'eodhd') }
    expect(shownDescription(english, 'fr')).toEqual({
      language: 'en',
      text: 'From EODHD.',
      source: 'eodhd',
      languages: ['en'],
    })
    expect(shownDescription({ fr: text('Texte.'), en: null }, 'en')?.language).toBe('fr')
  })

  it('shows nothing without a text, or before the profile is read', () => {
    expect(shownDescription({ fr: null, en: null }, 'en')).toBeNull()
    expect(shownDescription(undefined, 'fr')).toBeNull()
  })
})
