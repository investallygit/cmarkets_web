import { describe, expect, it } from 'vitest'
import en from './locales/en'
import fr from './locales/fr'

const areaFiles = import.meta.glob<Record<string, unknown>>('./locales/*/*.json', {
  eager: true,
  import: 'default',
})

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  )
}

/** The top-level keys of each area file, by language: { en: { core: ['app', ...] } }. */
function topKeysByArea() {
  const byLanguage: Record<string, Record<string, string[]>> = {}
  for (const [path, strings] of Object.entries(areaFiles)) {
    const [, language, area] = /\/locales\/(\w+)\/(\w+)\.json$/.exec(path) ?? []
    byLanguage[language] = { ...byLanguage[language], [area]: Object.keys(strings).sort() }
  }
  return byLanguage
}

describe('translation files', () => {
  it('have the same keys in French and English', () => {
    expect(keysOf(fr).sort()).toEqual(keysOf(en).sort())
  })

  // A key repeated in a second area file would silently replace the first one's strings.
  it('keep each top-level key in one area file, the same one in both languages', () => {
    const { en: english, fr: french } = topKeysByArea()
    expect(french).toEqual(english)
    const keys = Object.values(english).flat()
    expect(new Set(keys).size).toBe(keys.length)
  })
})
