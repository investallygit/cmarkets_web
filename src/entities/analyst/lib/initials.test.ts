import { describe, expect, it } from 'vitest'
import { initialsOf } from './initials'

describe('initialsOf', () => {
  it('takes the first two initials of a name', () => {
    expect(initialsOf('K. Atangana')).toBe('KA')
    expect(initialsOf('jean-paul ekane mbarga')).toBe('JE')
    expect(initialsOf('')).toBe('')
  })
})
