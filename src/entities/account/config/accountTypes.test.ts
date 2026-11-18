import { describe, expect, it } from 'vitest'
import { typesFor } from './accountTypes'

describe('typesFor (B92)', () => {
  it('keeps an account within its family: client, SVT, employee', () => {
    expect(typesFor('trader')).toEqual([
      'student',
      'analyst',
      'manager',
      'trader',
      'journalist',
      'ceo',
      'newsProvider',
    ])
    expect(typesFor('svt')).toEqual(['svt'])
    expect(typesFor('admin')).toEqual(['dataAdmin', 'admin'])
  })
})
