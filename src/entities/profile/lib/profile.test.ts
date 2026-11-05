import { describe, expect, it } from 'vitest'
import type { ContactRules } from '@/shared/api/contracts'
import { initialsOf, previewContactMode, typesByMode } from './profile'

const RULES: ContactRules = {
  student: 'request',
  analyst: 'direct',
  manager: 'direct',
  trader: 'none',
  journalist: 'direct',
  ceo: 'direct',
}

describe('profile helpers', () => {
  it('make initials of the name, as the avatars of the mockups', () => {
    expect(initialsOf('K. Atangana')).toBe('KA')
    expect(initialsOf('A. Tchakounté')).toBe('AT')
    expect(initialsOf('Mvondo')).toBe('MV')
  })

  it("show each viewer the button of the user's rule for the type, none when hidden", () => {
    const privacy = { visibility: 'members', contactRules: RULES } as const
    expect(previewContactMode('student', privacy)).toBe('request')
    expect(previewContactMode('trader', privacy)).toBe('none')
    expect(previewContactMode('manager', { ...privacy, visibility: 'hidden' })).toBe('none')
    expect(typesByMode(privacy)).toEqual({
      direct: ['analyst', 'manager', 'journalist', 'ceo'],
      request: ['student'],
      none: ['trader'],
    })
  })
})
