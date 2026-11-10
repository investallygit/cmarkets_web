import type { AccountType, MeDto, ModuleCode } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'
import type { ScreenDefinition } from '@/shared/routes/screens'
import { audienceOf } from './accountTypes'

type UserAccess = Pick<MeDto, 'accountType' | 'permissions'>

/**
 * Clients only see client screens and employees only the back-office (spec section 12).
 * The server enforces the same rules; this only decides what the UI offers.
 */
export function canAccessScreen(
  user: UserAccess,
  screen: Pick<ScreenDefinition, 'audience' | 'permission'>,
): boolean {
  if (audienceOf(user.accountType) !== screen.audience) return false
  return screen.permission === undefined || user.permissions.includes(screen.permission)
}

/**
 * The subscription module a screen needs and the user's plan lacks (spec section 6), if any: the
 * screen then offers an upgrade rather than its content.
 */
export function lockedModule(
  user: Pick<MeDto, 'modules'>,
  screen: Pick<ScreenDefinition, 'module'>,
): ModuleCode | null {
  return screen.module && !user.modules.includes(screen.module) ? screen.module : null
}

/**
 * The user writes to others and others to them: messaging, with a status an Admin approved when
 * the type needs one (spec section 12). Waiting, MSG says it opens once approved.
 */
export function mayWriteMessages(user: Pick<MeDto, 'permissions' | 'verificationStatus'>): boolean {
  return (
    user.permissions.includes('messages:write') &&
    user.verificationStatus !== 'pending' &&
    user.verificationStatus !== 'rejected'
  )
}

const HOME_SCREEN: Record<AccountType, string> = {
  student: 'MKT',
  analyst: 'MKT',
  manager: 'MKT',
  trader: 'MKT',
  journalist: 'MKT',
  ceo: 'MKT',
  newsProvider: 'MKT',
  dataAdmin: 'IMP',
  admin: 'USER',
}

/** Landing screen: market dashboard for clients, data import for the Data admin, accounts for the Admin. */
export function homePathFor(user: UserAccess, screens: readonly ScreenDefinition[]): string {
  const home = screens.find((screen) => screen.id === HOME_SCREEN[user.accountType])
  if (home && canAccessScreen(user, home)) return home.path
  const firstInMenu = screens.find((screen) => screen.inMenu && canAccessScreen(user, screen))
  return firstInMenu?.path ?? routes.settings
}
