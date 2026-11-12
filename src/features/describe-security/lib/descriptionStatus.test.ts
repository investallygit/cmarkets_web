import { describe, expect, it } from 'vitest'
import type { StoredDescriptionDto } from '@/shared/api/contracts'
import { emptyLanguageView } from './descriptionStatus'

const stored = (eodhd: boolean): StoredDescriptionDto => ({
  securityId: 'SEMC',
  fr: null,
  en: null,
  eodhd: eodhd ? { text: 'From EODHD.', updatedAt: '2026-11-12T03:00:00Z' } : null,
})

describe('emptyLanguageView: what EQS shows of a language left empty', () => {
  it("shows EODHD's English where the Data admin wrote none", () => {
    expect(emptyLanguageView(stored(true), 'en', { fr: '', en: '' })).toBe('eodhd')
    // The French screen then shows that English, marked.
    expect(emptyLanguageView(stored(true), 'fr', { fr: '', en: '' })).toBe('other')
  })

  it("shows the other language's text, as typed, else nothing", () => {
    expect(emptyLanguageView(stored(false), 'en', { fr: 'Texte.', en: '' })).toBe('other')
    expect(emptyLanguageView(stored(false), 'fr', { fr: '', en: '  ' })).toBe('none')
  })
})
