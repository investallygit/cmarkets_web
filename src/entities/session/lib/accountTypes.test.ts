import { describe, expect, it } from 'vitest'
import type { AccountType } from '@/shared/api/contracts'
import { audienceOf, hasPlan } from './accountTypes'

describe('the account types', () => {
  it('gives a plan to the clients, not to the SVT nor the employees (ROADMAP decision 16)', () => {
    const clients: AccountType[] = [
      'student',
      'analyst',
      'manager',
      'trader',
      'journalist',
      'ceo',
      'newsProvider',
    ]
    clients.forEach((type) => expect(hasPlan(type)).toBe(true))
    ;(['svt', 'dataAdmin', 'admin'] as const).forEach((type) => expect(hasPlan(type)).toBe(false))
    // The SVT works in the terminal all the same, the employees in the back-office.
    expect([audienceOf('svt'), audienceOf('admin')]).toEqual(['client', 'backoffice'])
  })
})
