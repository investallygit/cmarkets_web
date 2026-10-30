import {
  Bell,
  BookOpen,
  Briefcase,
  Calculator,
  CalendarDays,
  ChartSpline,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Newspaper,
  PenLine,
  ScanSearch,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/shared/api/contracts'
import type { ScreenTextKey, TranslationKey } from '@/shared/i18n'
import { routes } from './paths'

/** Clients use the terminal; Data admin and Admin only the back-office (spec section 12). */
export type Audience = 'client' | 'backoffice'

export interface ScreenDefinition {
  /** Unique key; also the layout key of /me/layouts/{screen}. */
  id: ScreenTextKey
  /** Function code shown in the left menu and typed in the command bar (spec section 8). */
  code: string
  /** Link to the screen, used by the menu and the command bar. */
  path: string
  /** Route pattern when the screen has routes of its own below `path`, e.g. tabs. */
  routePattern?: string
  audience: Audience
  permission?: Permission
  /** Listed in the left menu (spec section 9). */
  inMenu: boolean
  icon: LucideIcon
  titleKey: TranslationKey
  menuKey: TranslationKey
}

/** Props every page receives from the router. */
export interface ScreenProps {
  /** Screen key, e.g. "MKT": also the layout key of /me/layouts/{screen}. */
  screenId: string
}

interface ScreenOptions {
  permission?: Permission
  inMenu?: boolean
  routePattern?: string
}

function screen(
  id: ScreenTextKey,
  code: string,
  path: string,
  audience: Audience,
  icon: LucideIcon,
  { permission, inMenu = false, routePattern }: ScreenOptions = {},
): ScreenDefinition {
  return {
    id,
    code,
    path,
    routePattern,
    audience,
    permission,
    inMenu,
    icon,
    titleKey: `screens.${id}.title`,
    menuKey: `screens.${id}.menu`,
  }
}

/**
 * Every screen of the app, read by the router, the left menu, the command bar and the access
 * checks. The page that renders each screen is chosen in app/routes.
 */
// prettier-ignore
export const SCREENS: readonly ScreenDefinition[] = [
  // Client menu, in the mockup order: MKT, EQS, YCRV, PORT, PUB, N, ALRT, CFG.
  screen('MKT', 'MKT', routes.market, 'client', LayoutDashboard, { permission: 'market:read', inMenu: true }),
  screen('EQS', 'EQS', routes.screener, 'client', ScanSearch, { permission: 'analysis:read', inMenu: true }),
  screen('YCRV', 'YCRV', routes.yieldCurves, 'client', ChartSpline, { permission: 'analysis:read', inMenu: true }),
  screen('PORT', 'PORT', routes.portfolio, 'client', Briefcase, { permission: 'portfolios:read', inMenu: true, routePattern: routes.portfolioTabs }),
  screen('PUB', 'PUB', routes.library, 'client', BookOpen, { permission: 'research:read', inMenu: true }),
  screen('N', 'N', routes.news, 'client', Newspaper, { permission: 'market:read', inMenu: true, routePattern: routes.newsTabs }),
  screen('ALRT', 'ALRT', routes.alerts, 'client', Bell, { permission: 'alerts:write', inMenu: true }),
  screen('CFG', 'CFG', routes.settings, 'client', Settings, { inMenu: true }),

  // Client screens opened from the command bar or from another screen.
  screen('DES', 'DES', routes.security, 'client', FileText, { permission: 'market:read' }),
  screen('YAS', 'YAS', routes.bondCalculator, 'client', Calculator, { permission: 'analysis:read' }),
  screen('PUBNEW', 'PUB NEW', routes.publishingStudio, 'client', PenLine, { permission: 'publications:write' }),
  screen('CAL', 'CAL', routes.calendar, 'client', CalendarDays, { permission: 'market:read' }),

  // Back-office, Data admin (screen 6).
  screen('DATA', 'DATA', routes.dataSession, 'backoffice', Database, { permission: 'data:import', inMenu: true }),
  screen('IMP', 'IMP', routes.dataImport, 'backoffice', Upload, { permission: 'data:import', inMenu: true }),
  screen('CORR', 'CORR', routes.dataCorrections, 'backoffice', Wrench, { permission: 'data:import', inMenu: true }),
  screen('NEWS', 'NEWS', routes.dataContent, 'backoffice', Newspaper, { permission: 'content:publish', inMenu: true }),
  screen('EODH', 'EODH', routes.dataEodhd, 'backoffice', Server, { permission: 'data:import', inMenu: true }),
  screen('HIST', 'HIST', routes.dataHistory, 'backoffice', History, { permission: 'data:import', inMenu: true }),

  // Back-office, Admin (screen 9).
  screen('USER', 'USER', routes.adminUsers, 'backoffice', Users, { permission: 'users:manage', inMenu: true }),
  screen('ANLY', 'ANLY', routes.adminAnalysts, 'backoffice', UserCheck, { permission: 'moderation:manage', inMenu: true }),
  screen('MOD', 'MOD', routes.adminModeration, 'backoffice', ShieldCheck, { permission: 'moderation:manage', inMenu: true }),
  screen('PAY', 'PAY', routes.adminPayouts, 'backoffice', Wallet, { permission: 'publications:earnings', inMenu: true }),
  screen('ADMCFG', 'CFG', routes.adminSettings, 'backoffice', Settings, { permission: 'settings:manage', inMenu: true }),
  screen('AUDT', 'AUDT', routes.adminAudit, 'backoffice', ScrollText, { permission: 'audit:read', inMenu: true }),
]

export function screenById(id: ScreenTextKey): ScreenDefinition {
  const found = SCREENS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown screen ${id}`)
  return found
}
