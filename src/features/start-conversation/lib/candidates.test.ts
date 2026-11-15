import { describe, expect, it } from 'vitest'
import type { DirectoryEntryDto, MessagingContactDto } from '@/shared/api/contracts'
import { candidatesOf, mayAdd } from './candidates'

const contact = (
  userId: string,
  displayName: string,
  organization: string,
  overrides: Partial<MessagingContactDto> = {},
): MessagingContactDto => ({
  userId,
  displayName,
  accountType: 'manager',
  organization,
  contactMode: 'direct',
  ...overrides,
})

const card = (userId: string, displayName: string, jobTitle: string): DirectoryEntryDto =>
  ({
    userId,
    displayName,
    jobTitle,
    accountType: 'trader',
    contactMode: 'direct',
  }) as DirectoryEntryDto

describe('candidatesOf', () => {
  const contacts = [
    contact('user-tchakounte', 'A. Tchakounté', 'Insurer F'),
    contact('user-ngoma', 'B. Ngoma', 'Pension fund G'),
    contact('user-bekale', 'T. Bekale', 'Bank C', { accountType: 'trader', contactMode: 'none' }),
  ]

  it('offers the linked contacts first, with their organisation, then the directory cards', () => {
    const people = candidatesOf(
      contacts,
      [card('user-ngoma', 'B. Ngoma', 'Fixed income'), card('user-owona', 'P. Owona', 'CIO')],
      '',
    )

    expect(people.map((person) => [person.displayName, person.detail])).toEqual([
      ['A. Tchakounté', 'Insurer F'],
      ['B. Ngoma', 'Pension fund G'],
      ['P. Owona', 'CIO'],
    ])
  })

  it('finds a contact by its name or its organisation, without accents nor case', () => {
    expect(candidatesOf(contacts, [], 'tchakounte').map((person) => person.userId)).toEqual([
      'user-tchakounte',
    ])
    expect(candidatesOf(contacts, [], ' PENSION ').map((person) => person.userId)).toEqual([
      'user-ngoma',
    ])
    expect(candidatesOf(contacts, [], 'Bank C')).toEqual([])
  })
})

describe('mayAdd', () => {
  const trader = { accountType: 'trader' as const }
  const svt = { accountType: 'svt' as const }

  it('lets a client make a group of clients, up to its members', () => {
    expect(mayAdd([trader], trader, trader, 50)).toBe(true)
    expect(
      mayAdd(
        Array.from({ length: 49 }, () => trader),
        trader,
        trader,
        50,
      ),
    ).toBe(false)
  })

  it('keeps an SVT one to one: for an SVT, with an SVT chosen, or an SVT to add', () => {
    expect(mayAdd([], svt, trader, 50)).toBe(true)
    expect(mayAdd([trader], svt, trader, 50)).toBe(false)
    expect(mayAdd([svt], trader, trader, 50)).toBe(false)
    expect(mayAdd([], trader, svt, 50)).toBe(true)
    expect(mayAdd([trader], trader, svt, 50)).toBe(false)
  })
})
