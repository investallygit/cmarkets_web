import { describe, expect, it } from 'vitest'
import type { MeDto } from '@/shared/api/contracts'
import { SCREENS, screenById } from '@/shared/routes/screens'
import { canAccessScreen, homePathFor, lockedModule } from './access'

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
