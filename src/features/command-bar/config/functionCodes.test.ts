import { describe, expect, it } from 'vitest'
import type { MeDto } from '@/shared/api/contracts'
import { appliesToSecurity, availableFunctions } from './functionCodes'

type Access = Pick<MeDto, 'accountType' | 'permissions'>

const analyst: Access = {
  accountType: 'analyst',
  permissions: ['market:read', 'analysis:read', 'research:read', 'publications:write'],
}
const admin: Access = { accountType: 'admin', permissions: ['users:manage', 'settings:manage'] }

describe('function codes (spec section 8)', () => {
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
