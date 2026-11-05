import { describe, expect, it } from 'vitest'
import { ROLE_PERMISSIONS, ROLE_QUOTAS } from './users'

// The permission matrix of spec section 12, for the Journalist and the CEO of its second version.
describe('role permissions', () => {
  it('lets the Journalist and the CEO read the analysis without saving it', () => {
    for (const role of ['journalist', 'ceo'] as const) {
      expect(ROLE_PERMISSIONS[role]).toEqual(
        expect.arrayContaining([
          'market:read',
          'market:orderbook',
          'analysis:read',
          'alerts:write',
          'research:read',
          'research:buy',
        ]),
      )
      for (const permission of [
        'analysis:save',
        'portfolios:write',
        'publications:write',
      ] as const) {
        expect(ROLE_PERMISSIONS[role]).not.toContain(permission)
      }
      expect(ROLE_QUOTAS[role]).toEqual({ portfolios: 0, alerts: 20 })
    }
  })

  it("gives the exports and the organisation's portfolios to the CEO, not to the Journalist", () => {
    expect(ROLE_PERMISSIONS.ceo).toEqual(
      expect.arrayContaining(['analysis:export', 'portfolios:read']),
    )
    expect(ROLE_PERMISSIONS.journalist).not.toContain('analysis:export')
    expect(ROLE_PERMISSIONS.journalist).not.toContain('portfolios:read')
  })

  it('keeps saved screens and drawings for the other clients', () => {
    for (const role of ['student', 'analyst', 'manager', 'trader'] as const) {
      expect(ROLE_PERMISSIONS[role]).toContain('analysis:save')
    }
  })

  it('lists the six client types in the directory and lets them write; the Admin browses it', () => {
    const network = ['directory:list', 'directory:profile', 'messages:write'] as const
    for (const role of ['student', 'analyst', 'manager', 'trader', 'journalist', 'ceo'] as const) {
      expect(ROLE_PERMISSIONS[role]).toEqual(expect.arrayContaining([...network]))
    }
    expect(ROLE_PERMISSIONS.admin).toContain('directory:list')
    expect(ROLE_PERMISSIONS.admin).not.toContain('directory:profile')
    expect(ROLE_PERMISSIONS.admin).not.toContain('messages:write')
    for (const permission of network) expect(ROLE_PERMISSIONS.dataAdmin).not.toContain(permission)
  })
})
