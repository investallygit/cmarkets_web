import type { MeDto, SecurityType } from '@/shared/api/contracts'
import type { TranslationKey } from '@/shared/i18n'
import {
  bondCalculatorPath,
  routes,
  securityPath,
  type SecurityFunction,
} from '@/shared/navigation/paths'
import { canAccessScreen } from './access'
import { SCREENS, screenById, type ScreenDefinition } from './screens'

/** none: "EQS"; security: "SEMC DES"; optional-security: "N" or "SIAT N". */
export type FunctionTarget = 'none' | 'security' | 'optional-security'

export interface FunctionCode {
  code: string
  labelKey: TranslationKey
  target: FunctionTarget
  /** Screen opened, used for the access check. */
  screen: ScreenDefinition
  /** Security types the function makes sense for; all types when absent. */
  appliesTo?: readonly SecurityType[]
  resolve: (securityId?: string) => string
}

interface SecurityTab {
  code: string
  fn: SecurityFunction
  labelKey: TranslationKey
  appliesTo?: readonly SecurityType[]
}

/** Tabs of the security profile; each one matches a command bar code (spec section 9, screen 2). */
const SECURITY_TABS: readonly SecurityTab[] = [
  { code: 'DES', fn: 'des', labelKey: 'functions.DES' },
  { code: 'GP', fn: 'gp', labelKey: 'functions.GP' },
  { code: 'FA', fn: 'fa', labelKey: 'functions.FA', appliesTo: ['equity'] },
  { code: 'DVD', fn: 'dvd', labelKey: 'functions.DVD', appliesTo: ['equity'] },
  { code: 'DOC', fn: 'doc', labelKey: 'functions.DOC' },
  { code: 'HDS', fn: 'hds', labelKey: 'functions.HDS', appliesTo: ['equity'] },
  { code: 'ANA', fn: 'ana', labelKey: 'functions.ANA' },
]

const SECURITY_SCREENS = new Set(['DES', 'YAS', 'N'])

/** Every function code of the command bar (spec section 8). */
export const FUNCTION_CODES: readonly FunctionCode[] = [
  ...SECURITY_TABS.map(({ code, fn, labelKey, appliesTo }): FunctionCode => ({
    code,
    labelKey,
    target: 'security',
    screen: screenById('DES'),
    appliesTo,
    resolve: (securityId) => securityPath(securityId ?? '', fn),
  })),
  {
    code: 'YAS',
    labelKey: 'functions.YAS',
    target: 'security',
    screen: screenById('YAS'),
    appliesTo: ['bond'],
    resolve: (securityId) => bondCalculatorPath(securityId ?? ''),
  },
  {
    code: 'N',
    labelKey: 'functions.N',
    target: 'optional-security',
    screen: screenById('N'),
    resolve: (securityId) => (securityId ? securityPath(securityId, 'n') : routes.news),
  },
  ...SCREENS.filter((screen) => !SECURITY_SCREENS.has(screen.id)).map((screen): FunctionCode => ({
    code: screen.code,
    labelKey: screen.titleKey,
    target: 'none',
    screen,
    resolve: () => screen.path,
  })),
]

export function appliesToSecurity(fn: FunctionCode, type: SecurityType): boolean {
  return !fn.appliesTo || fn.appliesTo.includes(type)
}

/** Codes the user may run. Shared codes such as CFG resolve to the screen of the user's audience. */
export function availableFunctions(
  user: Pick<MeDto, 'accountType' | 'permissions'>,
): FunctionCode[] {
  return FUNCTION_CODES.filter((fn) => canAccessScreen(user, fn.screen))
}
