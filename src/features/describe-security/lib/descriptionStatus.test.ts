import { describe, expect, it } from 'vitest'
import type { DescriptionVersionsDto } from '@/shared/api/contracts'
import { emptyLanguageView, languageChanged, latestVersion } from './descriptionStatus'

const version = (text: string | null, source: string | null = null) => ({
  version: 1,
  text,
  source,
  author: 'A. Mbarga',
  fromFile: false,
  writtenAt: '2026-11-04T08:30:00Z',
})

const versions = (over: Partial<DescriptionVersionsDto> = {}): DescriptionVersionsDto => ({
  objectType: 'security',
  objectId: 'SEMC',
  fr: [],
  en: [],
  eodhd: null,
  ...over,
})

describe('the description form', () => {
  it('reads the latest version of a language', () => {
    expect(latestVersion(versions({ fr: [version('Texte.')] }), 'fr')?.text).toBe('Texte.')
    expect(latestVersion(versions(), 'en')).toBeNull()
  })

  it("says what the screens show of an empty language: EODHD's English, the other, nothing", () => {
    const eodhd = { text: 'From EODHD.', updatedAt: '2026-11-12T03:00:00Z' }
    expect(emptyLanguageView(versions({ eodhd }), 'en', { fr: '', en: '' })).toBe('eodhd')
    expect(emptyLanguageView(versions({ eodhd }), 'fr', { fr: '', en: '' })).toBe('other')
    expect(emptyLanguageView(versions(), 'fr', { fr: '', en: 'Text.' })).toBe('other')
    expect(emptyLanguageView(versions(), 'fr', { fr: '', en: ' ' })).toBe('none')
  })

  it('counts a changed text, or a changed source of a text, as a new version', () => {
    const latest = version('Texte.', 'Rapport annuel 2025')
    expect(languageChanged(latest, ' Texte. ', 'Rapport annuel 2025 ')).toBe(false)
    expect(languageChanged(latest, 'Texte.', 'Rapport semestriel')).toBe(true)
    expect(languageChanged(latest, '', '')).toBe(true)
    // A removed language stays removed whatever its source says.
    expect(languageChanged(version(null), '', 'Rapport')).toBe(false)
    expect(languageChanged(null, 'Nouveau.', '')).toBe(true)
  })
})
