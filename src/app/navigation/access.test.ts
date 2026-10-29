import { describe, expect, it } from 'vitest'
import type { MeDto } from '@/shared/api/contracts'
import { canAccessScreen, homePathFor } from './access'
import { appliesToSecurity, availableFunctions } from './functionCodes'
import { SCREENS, screenById } from './screens'

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

  it('resolves shared function codes to the screen of the user', () => {
    const cfg = (user: Access) => availableFunctions(user).filter((fn) => fn.code === 'CFG')
    expect(cfg(analyst).map((fn) => fn.resolve())).toEqual(['/cfg'])
    expect(cfg(admin).map((fn) => fn.resolve())).toEqual(['/admin/settings'])
  })

  it('offers bond functions for bonds and equity functions for equities', () => {
    const byCode = (code: string) => availableFunctions(analyst).find((fn) => fn.code === code)!
    expect(appliesToSecurity(byCode('YAS'), 'bond')).toBe(true)
    expect(appliesToSecurity(byCode('YAS'), 'equity')).toBe(false)
    expect(appliesToSecurity(byCode('FA'), 'equity')).toBe(true)
    expect(appliesToSecurity(byCode('FA'), 'bond')).toBe(false)
    expect(appliesToSecurity(byCode('GP'), 'bond')).toBe(true)
  })
})
