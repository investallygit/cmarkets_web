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

  it('opens bond pricing from BP and YAS, with or without a bond', () => {
    const byCode = (code: string) => availableFunctions(analyst).find((fn) => fn.code === code)!
    expect(byCode('BP').resolve()).toBe('/bp')
    expect(byCode('YAS').resolve('ECMR-6.25-2029')).toBe('/bp/ECMR-6.25-2029')
    expect(byCode('YAS').target).toBe('optional-security')
  })

  it('offers bond functions for bonds and equity functions for equities', () => {
    const byCode = (code: string) => availableFunctions(analyst).find((fn) => fn.code === code)!
    expect(appliesToSecurity(byCode('BP'), 'bond')).toBe(true)
    expect(appliesToSecurity(byCode('BP'), 'equity')).toBe(false)
    expect(appliesToSecurity(byCode('YAS'), 'bond')).toBe(true)
    expect(appliesToSecurity(byCode('FA'), 'equity')).toBe(true)
    expect(appliesToSecurity(byCode('FA'), 'bond')).toBe(false)
    expect(appliesToSecurity(byCode('GP'), 'bond')).toBe(true)
  })

  it("opens an ETF's holdings, performance and distributions, tabs of its profile (screen 19)", () => {
    const byCode = (code: string) => availableFunctions(analyst).find((fn) => fn.code === code)!
    expect(byCode('HLD').resolve('IWDA.LSE')).toBe('/securities/IWDA.LSE/hld')
    expect(byCode('PERF').resolve('IWDA.LSE')).toBe('/securities/IWDA.LSE/perf')
    expect(byCode('DIST').resolve('VUSA.LSE')).toBe('/securities/VUSA.LSE/dist')
    expect(appliesToSecurity(byCode('HLD'), 'equity')).toBe(false)
    expect(appliesToSecurity(byCode('DIST'), 'etf')).toBe(true)
  })

  it("opens a bond's schedule and ratings, tabs of its profile (screen 20)", () => {
    const byCode = (code: string) => availableFunctions(analyst).find((fn) => fn.code === code)!
    expect(byCode('CF').resolve('ECMR-6.25-2029')).toBe('/securities/ECMR-6.25-2029/cf')
    expect(byCode('RAT').resolve('GAB-6.50-2028')).toBe('/securities/GAB-6.50-2028/rat')
    expect(appliesToSecurity(byCode('CF'), 'equity')).toBe(false)
    expect(appliesToSecurity(byCode('RAT'), 'bond')).toBe(true)
    // DES opens every security, the profile of its type.
    expect(appliesToSecurity(byCode('DES'), 'equity')).toBe(true)
    expect(appliesToSecurity(byCode('DES'), 'bond')).toBe(true)
  })
})
