import { describe, expect, it } from 'vitest'
import { contactMode, DEFAULT_CONTACT_RULES, type ContactSituation } from './contact'

// The contact rules of spec section 15.
const recipient: ContactSituation['recipient'] = {
  userId: 'user-analyst',
  accountType: 'analyst',
  messaging: true,
  visibility: 'members',
  contactRules: DEFAULT_CONTACT_RULES,
}

const situation = (patch: Partial<ContactSituation> = {}): ContactSituation => ({
  sender: { userId: 'user-manager', accountType: 'manager', messaging: true },
  recipient,
  blocked: false,
  conversationOpen: false,
  ...patch,
})

describe('contact rules', () => {
  it('open a conversation at once by default, and ask a Student for a request', () => {
    expect(contactMode(situation())).toBe('direct')
    const student = { userId: 'user-student', accountType: 'student', messaging: true } as const
    expect(contactMode(situation({ sender: student }))).toBe('request')
  })

  it('follow the rule the recipient set for the type of the sender', () => {
    const contactRules = { ...DEFAULT_CONTACT_RULES, manager: 'none', trader: 'request' } as const
    const closed = { ...recipient, contactRules }
    expect(contactMode(situation({ recipient: closed }))).toBe('none')
    const trader = { userId: 'user-trader', accountType: 'trader', messaging: true } as const
    expect(contactMode(situation({ recipient: closed, sender: trader }))).toBe('request')
  })

  it('keep a conversation open when the rules change or the profile is hidden', () => {
    const closed = {
      ...recipient,
      visibility: 'hidden',
      contactRules: { ...DEFAULT_CONTACT_RULES, manager: 'none' },
    } as const
    expect(contactMode(situation({ recipient: closed }))).toBe('none')
    expect(contactMode(situation({ recipient: closed, conversationOpen: true }))).toBe('direct')
  })

  it('let a block override everything, an open conversation included', () => {
    expect(contactMode(situation({ blocked: true }))).toBe('none')
    expect(contactMode(situation({ blocked: true, conversationOpen: true }))).toBe('none')
  })

  it('leave the CMarket employees out, and nobody writes to themselves', () => {
    const admin = { userId: 'user-admin', accountType: 'admin', messaging: false } as const
    expect(contactMode(situation({ sender: admin }))).toBe('none')
    const dataAdmin = { ...recipient, userId: 'user-data-admin', accountType: 'dataAdmin' } as const
    expect(contactMode(situation({ recipient: dataAdmin, conversationOpen: true }))).toBe('none')
    const self = { userId: 'user-analyst', accountType: 'analyst', messaging: true } as const
    expect(contactMode(situation({ sender: self }))).toBe('none')
  })

  it('wait for the approval of a status, to write and to be written to', () => {
    const pending = { ...recipient, userId: 'user-moussavou', messaging: false }
    expect(contactMode(situation({ recipient: pending }))).toBe('none')
    const sender = { userId: 'user-moussavou', accountType: 'analyst', messaging: false } as const
    expect(contactMode(situation({ sender }))).toBe('none')
  })
})
