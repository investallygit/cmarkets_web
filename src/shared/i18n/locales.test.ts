import i18n from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'
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

/** Each string with its key: [['common.loading', 'Loading'], ...]. */
function stringsOf(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, child]) =>
    stringsOf(child, prefix ? `${prefix}.${key}` : key),
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

describe('the French of a plan and its price', () => {
  afterEach(() => i18n.changeLanguage('en'))

  // The live site read "102 jours restants de Analyse, d’une valeur de XAF 377 260 HT" (19 November
  // 2026): "de" before a vowel, the currency before the amount, as no other French string has it.
  it('says "la formule" before a plan and writes an amount before its currency', async () => {
    await i18n.changeLanguage('fr')
    expect(
      i18n.t('subscription.checkout.proration.daysLeft', {
        days: 102,
        plan: 'Analyse',
        currency: 'XAF',
        value: '377 260',
      }),
    ).toBe('102 jours restants de la formule Analyse, d’une valeur de 377 260 XAF HT.')
    expect(
      i18n.t('subscriptionAdmin.proration.free', { plan: 'Professionnel', date: '01/12/2026' }),
    ).toBe(
      'La formule Professionnel est gratuite par convention : une période complète à partir d’aujourd’hui, jusqu’au 01/12/2026.',
    )
    const french = stringsOf(fr)
    expect(french.filter(([, text]) => /\bde \{\{plan\}\}/.test(text))).toEqual([])
    expect(french.filter(([, text]) => /^\{\{plan\}\} est /.test(text))).toEqual([])
    expect(
      french.filter(([, text]) => /\{\{currency\}\} \{\{(amount|value)\}\}/.test(text)),
    ).toEqual([])
  })
})
