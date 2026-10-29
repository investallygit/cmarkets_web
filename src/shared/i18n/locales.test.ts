import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import fr from './locales/fr.json'

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('translation files', () => {
  it('have the same keys in French and English', () => {
    expect(keysOf(fr).sort()).toEqual(keysOf(en).sort())
  })
})
