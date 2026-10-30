import { describe, expect, it } from 'vitest'
import type { MeDto } from '@/shared/api/contracts'
import { SCREENS, screenById } from '@/shared/routes/screens'
import { canAccessScreen, homePathFor } from './access'

type Access = Pick<MeDto, 'accountType' | 'permissions'>

const student: Access = {
  accountType: 'student',
  permissions: ['market:read', 'analysis:read', 'portfolios:read', 'alerts:write', 'research:read'],
}
const analyst: Access = {
  accountType: 'analyst',
  permissions: ['market:read', 'analysis:read', 'research:read', 'publications:write'],
}
const dataAdmin: Access = { accountType: 'dataAdmin', permissions: ['market:read', 'data:import'] }
const admin: Access = { accountType: 'admin', permissions: ['users:manage', 'settings:manage'] }

describe('screen access (spec section 12)', () => {
  it('requires the screen permission', () => {
    expect(canAccessScreen(analyst, screenById('PUBNEW'))).toBe(true)
    expect(canAccessScreen(student, screenById('PUBNEW'))).toBe(false)
  })

  it('keeps employees in the back-office and clients out of it', () => {
    expect(canAccessScreen(dataAdmin, screenById('MKT'))).toBe(false)
    expect(canAccessScreen(dataAdmin, screenById('IMP'))).toBe(true)
    expect(canAccessScreen(analyst, screenById('IMP'))).toBe(false)
  })

  it('lands each account type on its home screen', () => {
    expect(homePathFor(student, SCREENS)).toBe('/mkt')
    expect(homePathFor(dataAdmin, SCREENS)).toBe('/imp')
    expect(homePathFor(admin, SCREENS)).toBe('/admin/users')
  })
})
