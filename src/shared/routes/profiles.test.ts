import { describe, expect, it } from 'vitest'
import {
  hasProfileTab,
  profileTabLabelKey,
  SECURITY_PROFILES,
  securityFunctionTypes,
} from './profiles'

describe('the profile of each security type (spec section 9)', () => {
  it("gives a bond screen 20's tabs, then the news and research every profile has", () => {
    expect(SECURITY_PROFILES.bond.tabs).toEqual(['des', 'gp', 'bp', 'cf', 'rat', 'doc', 'n', 'ana'])
    expect(SECURITY_PROFILES.equity.tabs).toEqual([
      'des',
      'gp',
      'fa',
      'dvd',
      'n',
      'doc',
      'hds',
      'ana',
    ])
  })

  it('offers a tab on the types whose profile has it', () => {
    expect(securityFunctionTypes('des')).toEqual(['equity', 'bond', 'etf'])
    expect(securityFunctionTypes('fa')).toEqual(['equity'])
    expect(securityFunctionTypes('cf')).toEqual(['bond'])
    expect(hasProfileTab('bond', 'dvd')).toBe(false)
    expect(hasProfileTab('equity', 'rat')).toBe(false)
    // An ETF has no accounts, dividends nor shareholders of its own.
    expect(hasProfileTab('etf', 'fa')).toBe(false)
    expect(hasProfileTab('etf', 'gp')).toBe(true)
  })

  it("names a bond's GP tab Price and yield, and lights YCRV", () => {
    expect(profileTabLabelKey('bond', 'gp')).toBe('security.tabs.priceYield')
    expect(profileTabLabelKey('equity', 'gp')).toBe('security.tabs.gp')
    expect(SECURITY_PROFILES.bond.menuParent).toBe('YCRV')
    expect(SECURITY_PROFILES.equity.menuParent).toBeUndefined()
  })

  it("gives an ETF its chart, its documents, its news and its research, and lights EQS as ETFS", () => {
    expect(SECURITY_PROFILES.etf.tabs).toEqual(['des', 'gp', 'doc', 'n', 'ana'])
    expect(SECURITY_PROFILES.etf.menuParent).toBe('EQS')
    expect(profileTabLabelKey('etf', 'gp')).toBe('security.tabs.gp')
  })
})
