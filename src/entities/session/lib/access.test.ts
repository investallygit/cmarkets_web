import { describe, expect, it } from 'vitest'
import type { MeDto } from '@/shared/api/contracts'
import { SCREENS, screenById } from '@/shared/routes/screens'
import { canAccessScreen, homePathFor, isInMenuOf, lockedModule, mayWriteMessages } from './access'

type Access = Pick<MeDto, 'accountType' | 'permissions'>

const student: Access = {
  accountType: 'student',
  permissions: ['market:read', 'analysis:read', 'portfolios:read', 'alerts:write', 'research:read'],
}
const analyst: Access = {
  accountType: 'analyst',
  permissions: ['market:read', 'analysis:read', 'research:read', 'publications:write'],
}
const journalist: Access = {
  accountType: 'journalist',
  permissions: [
    'market:read',
    'market:orderbook',
    'analysis:read',
    'alerts:write',
    'research:read',
  ],
}
const ceo: Access = {
  accountType: 'ceo',
  permissions: [...journalist.permissions, 'analysis:export', 'portfolios:read'],
}
const dataAdmin: Access = { accountType: 'dataAdmin', permissions: ['market:read', 'data:import'] }
const admin: Access = { accountType: 'admin', permissions: ['users:manage', 'settings:manage'] }
const svt: Access = {
  accountType: 'svt',
  permissions: ['market:read', 'messages:write', 'svt:approve'],
}
const trader: Access = {
  accountType: 'trader',
  permissions: ['market:read', 'analysis:read', 'portfolios:read', 'rfq:trade', 'rfq:read'],
}

describe('screen access (spec section 12)', () => {
  it('requires the screen permission', () => {
    expect(canAccessScreen(analyst, screenById('PUBNEW'))).toBe(true)
    expect(canAccessScreen(student, screenById('PUBNEW'))).toBe(false)
  })

  it('hides the screens outside the permissions: PORT for a Journalist, not for a CEO', () => {
    expect(canAccessScreen(journalist, screenById('PORT'))).toBe(false)
    expect(canAccessScreen(ceo, screenById('PORT'))).toBe(true)
    expect(canAccessScreen(journalist, screenById('EQS'))).toBe(true)
    expect(canAccessScreen(ceo, screenById('PUBNEW'))).toBe(false)
  })

  it('keeps employees in the back-office and clients out of it', () => {
    expect(canAccessScreen(dataAdmin, screenById('MKT'))).toBe(false)
    expect(canAccessScreen(dataAdmin, screenById('IMP'))).toBe(true)
    expect(canAccessScreen(analyst, screenById('IMP'))).toBe(false)
  })

  it('lands each account type on its home screen', () => {
    expect(homePathFor(student, SCREENS)).toBe('/mkt')
    expect(homePathFor(journalist, SCREENS)).toBe('/mkt')
    expect(homePathFor(dataAdmin, SCREENS)).toBe('/imp')
    expect(homePathFor(admin, SCREENS)).toBe('/admin/users')
    expect(homePathFor(svt, SCREENS)).toBe('/svt')
  })
})

describe('the SVT and the RFQ (ROADMAP decisions 15, 16 and 18)', () => {
  const menuOf = (user: Access) =>
    SCREENS.filter((screen) => isInMenuOf(user, screen)).map((screen) => screen.code)

  it('gives the SVT its own menu, the market screens a CEO reads open from the command bar only', () => {
    // SVT its home, TRD, AGR, the agreements that name its bank, by the code each opens (ROADMAP
    // steps 45, 46), and MSG, its messages with its linked traders (step 48).
    expect(menuOf(svt)).toEqual(['SVT', 'TRD', 'RFQ AGR', 'MSG', 'N', 'CFG'])
    expect(canAccessScreen(svt, screenById('MKT'))).toBe(true)
    expect(canAccessScreen(svt, screenById('RFQ'))).toBe(false)
  })

  it('puts RFQ after BS for a trader who holds its keys, and nowhere without them', () => {
    expect(menuOf(trader)).toEqual([
      'MKT',
      'CMDTY',
      'ECO',
      'FX',
      'EQS',
      'ETFS',
      'YCRV',
      'BP',
      'BS',
      'RFQ',
      'PORT',
      'N',
      'CFG',
    ])
    expect(
      menuOf({
        ...trader,
        permissions: trader.permissions.filter((key) => !key.startsWith('rfq:')),
      }),
    ).not.toContain('RFQ')
    expect(canAccessScreen(trader, screenById('TRD'))).toBe(false)
  })

  it("opens RFQ to a CEO, who reads its organisation's requests (ROADMAP step 44)", () => {
    expect(menuOf({ ...ceo, permissions: [...ceo.permissions, 'rfq:read'] })).toContain('RFQ')
    expect(menuOf(ceo)).not.toContain('RFQ')
  })
})

describe('subscription modules (spec section 6)', () => {
  it('locks the screens of a module the plan lacks', () => {
    const user = { modules: ['monitoring', 'analysis'] } satisfies Pick<MeDto, 'modules'>
    expect(lockedModule(user, screenById('PORT'))).toBe('portfolio')
    expect(lockedModule(user, screenById('EQS'))).toBeNull()
  })

  it('leaves research and settings out of the plans', () => {
    const user = { modules: [] } satisfies Pick<MeDto, 'modules'>
    expect(lockedModule(user, screenById('PUB'))).toBeNull()
    expect(lockedModule(user, screenById('CFG'))).toBeNull()
    expect(lockedModule(user, screenById('MKT'))).toBe('monitoring')
  })
})

describe('messaging (spec sections 12 and 15)', () => {
  const writer = { permissions: ['messages:write' as const], verificationStatus: null }

  it('opens to the clients who write, once an Admin approved their status if they need one', () => {
    expect(mayWriteMessages(writer)).toBe(true)
    expect(mayWriteMessages({ ...writer, verificationStatus: 'approved' })).toBe(true)
    expect(mayWriteMessages({ ...writer, verificationStatus: 'pending' })).toBe(false)
    expect(mayWriteMessages({ ...writer, verificationStatus: 'rejected' })).toBe(false)
    expect(mayWriteMessages({ permissions: ['users:manage'], verificationStatus: null })).toBe(
      false,
    )
  })
})
