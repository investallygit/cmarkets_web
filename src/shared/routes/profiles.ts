import type { SecurityType } from '@/shared/api/contracts'
import type { ScreenTextKey, TranslationKey } from '@/shared/i18n'
import type { SecurityFunction } from './paths'

/**
 * The profile a security's type opens (spec section 9, "Opening a profile by security type"):
 * DES in the command bar, a double-click in a list or a screener, a search result and a card
 * shared in MSG all lead to /securities/{id}/des, and the type that GET /securities/{id} answers
 * decides the profile, its tabs, its title and the menu entry it lights: screen 2 for an equity,
 * screen 20 for a bond, screen 19 for an ETF.
 */
export interface SecurityProfileKind {
  /** Its tabs, in order, each a command bar code. */
  tabs: readonly SecurityFunction[]
  /** Its name in the title bar. */
  titleKey: TranslationKey
  /** A tab named otherwise than in the other profiles: GP is "Price and yield" on a bond. */
  tabLabels?: Partial<Record<SecurityFunction, TranslationKey>>
  /** The menu entry lit while it shows, the screener that lists the type: BS for a bond. */
  menuParent?: ScreenTextKey
}

export const SECURITY_PROFILES: Record<SecurityType, SecurityProfileKind> = {
  // Screen 2.
  equity: {
    tabs: ['des', 'gp', 'fa', 'dvd', 'n', 'doc', 'hds', 'ana'],
    titleKey: 'screens.DES.title',
  },
  // Screen 20: the mockup's six tabs, then the news and the research every profile has; under BS,
  // which lists the bonds (the mockup, drawn before BS had an entry, lights YCRV).
  bond: {
    tabs: ['des', 'gp', 'bp', 'cf', 'rat', 'doc', 'n', 'ana'],
    titleKey: 'security.profiles.bond',
    tabLabels: { gp: 'security.tabs.priceYield' },
    menuParent: 'BS',
  },
  // Screen 19: the mockup's six tabs, then the news and the research every profile has; under
  // ETFS, which lists the ETFs (the mockup, drawn before ETFS had an entry, lights EQS).
  etf: {
    tabs: ['des', 'gp', 'hld', 'perf', 'dist', 'doc', 'n', 'ana'],
    titleKey: 'security.profiles.etf',
    menuParent: 'ETFS',
  },
}

const TYPES = Object.keys(SECURITY_PROFILES) as SecurityType[]

/** Whether the profile of the type has the tab. */
export function hasProfileTab(type: SecurityType, fn: SecurityFunction): boolean {
  return SECURITY_PROFILES[type].tabs.includes(fn)
}

/** The types whose profile has the tab: the command bar offers its code on those. */
export function securityFunctionTypes(fn: SecurityFunction): readonly SecurityType[] {
  return TYPES.filter((type) => hasProfileTab(type, fn))
}

/** The tab's name in the profile of the type. */
export function profileTabLabelKey(type: SecurityType, fn: SecurityFunction): TranslationKey {
  return SECURITY_PROFILES[type].tabLabels?.[fn] ?? `security.tabs.${fn}`
}
