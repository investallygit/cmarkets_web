import type { AccountType, MeDto } from '@/shared/api/contracts'
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

const HOME_SCREEN: Record<AccountType, string> = {
  student: 'MKT',
  analyst: 'MKT',
  manager: 'MKT',
  trader: 'MKT',
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
