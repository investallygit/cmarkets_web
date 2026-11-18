import { describe, expect, it } from 'vitest'
import { sectorNameOf } from './sectorName'

const SECTORS = [
  { code: 'SOV', name: 'Sovereign', nameFr: 'Souverain' },
  { code: 'BANK', name: 'Banking', nameFr: 'Banque' },
]

describe('sectorNameOf', () => {
  it('names a sector in French by its English name or its code (B17)', () => {
    expect(sectorNameOf(SECTORS, 'Sovereign', 'fr')).toBe('Souverain')
    expect(sectorNameOf(SECTORS, 'BANK', 'fr')).toBe('Banque')
  })

  it('keeps the name in English, and a sector it does not know', () => {
    expect(sectorNameOf(SECTORS, 'Sovereign', 'en')).toBe('Sovereign')
    expect(sectorNameOf(SECTORS, 'Telecoms', 'fr')).toBe('Telecoms')
    expect(sectorNameOf(undefined, 'Banking', 'fr')).toBe('Banking')
  })
})
