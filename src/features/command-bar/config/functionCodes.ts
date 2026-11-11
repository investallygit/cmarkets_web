import { canAccessScreen } from '@/entities/session'
import type { MeDto, SecurityType } from '@/shared/api/contracts'
import type { TranslationKey } from '@/shared/i18n'
import { bondPricingPath, routes, securityPath, type SecurityFunction } from '@/shared/routes/paths'
import { securityFunctionTypes } from '@/shared/routes/profiles'
import { SCREENS, screenById, type ScreenDefinition } from '@/shared/routes/screens'

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
}

/**
 * Tabs of the security profiles; each one matches a command bar code (spec section 9, screens 2
 * and 20), offered on the types whose profile has it. BP stays screen 16's code.
 */
const SECURITY_TABS: readonly SecurityTab[] = [
  { code: 'DES', fn: 'des', labelKey: 'functions.DES' },
  { code: 'GP', fn: 'gp', labelKey: 'functions.GP' },
  { code: 'FA', fn: 'fa', labelKey: 'functions.FA' },
  { code: 'DVD', fn: 'dvd', labelKey: 'functions.DVD' },
  { code: 'DOC', fn: 'doc', labelKey: 'functions.DOC' },
  { code: 'HDS', fn: 'hds', labelKey: 'functions.HDS' },
  { code: 'ANA', fn: 'ana', labelKey: 'functions.ANA' },
  { code: 'CF', fn: 'cf', labelKey: 'functions.CF' },
  { code: 'RAT', fn: 'rat', labelKey: 'functions.RAT' },
]

const SECURITY_SCREENS = new Set(['DES', 'BP', 'N'])

/** Every function code of the command bar (spec section 8). */
export const FUNCTION_CODES: readonly FunctionCode[] = [
  ...SECURITY_TABS.map(({ code, fn, labelKey }): FunctionCode => ({
    code,
    labelKey,
    target: 'security',
    screen: screenById('DES'),
    appliesTo: securityFunctionTypes(fn),
    resolve: (securityId) => securityPath(securityId ?? '', fn),
  })),
  // BP, bond pricing, with or without a bond ("ECMR 6.25 2029 BP"); YAS opens it too (spec section 8).
  ...(['BP', 'YAS'] as const).map((code): FunctionCode => ({
    code,
    labelKey: code === 'BP' ? 'screens.BP.title' : 'functions.YAS',
    target: 'optional-security',
    screen: screenById('BP'),
    appliesTo: ['bond'],
    resolve: (securityId) => bondPricingPath(securityId),
  })),
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
