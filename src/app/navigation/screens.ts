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
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { Audience } from '@/features/session'
import type { ScreenProps } from '@/screens/types'
import type { Permission } from '@/shared/api/contracts'
import type { ScreenTextKey, TranslationKey } from '@/shared/i18n'
import { routes } from '@/shared/navigation/paths'

export interface ScreenDefinition {
  /** Unique key; also the layout key of /me/layouts/{screen}. */
  id: ScreenTextKey
  /** Function code shown in the left menu and typed in the command bar (spec section 8). */
  code: string
  path: string
  audience: Audience
  permission?: Permission
  /** Listed in the left menu (spec section 9). */
  inMenu: boolean
  icon: LucideIcon
  titleKey: TranslationKey
  menuKey: TranslationKey
  component: LazyExoticComponent<ComponentType<ScreenProps>>
}

// Each screen is its own chunk, loaded on first visit.
const MarketDashboard = lazy(() =>
  import('@/screens/market-dashboard/MarketDashboardScreen').then((module) => ({
    default: module.MarketDashboardScreen,
  })),
)
const Placeholder = lazy(() =>
  import('@/screens/placeholder/PlaceholderScreen').then((module) => ({
    default: module.PlaceholderScreen,
  })),
)

interface ScreenOptions {
  permission?: Permission
  inMenu?: boolean
  component?: ScreenDefinition['component']
}

function screen(
  id: ScreenTextKey,
  code: string,
  path: string,
  audience: Audience,
  icon: LucideIcon,
  { permission, inMenu = false, component = Placeholder }: ScreenOptions = {},
): ScreenDefinition {
  return {
    id,
    code,
    path,
    audience,
    permission,
    inMenu,
    icon,
    titleKey: `screens.${id}.title`,
    menuKey: `screens.${id}.menu`,
    component,
  }
}

// prettier-ignore
export const SCREENS: readonly ScreenDefinition[] = [
  // Client menu, in the mockup order: MKT, EQS, YCRV, PORT, PUB, N, ALRT, CFG.
  screen('MKT', 'MKT', routes.market, 'client', LayoutDashboard, {
    permission: 'market:read',
    inMenu: true,
    component: MarketDashboard,
  }),
  screen('EQS', 'EQS', routes.screener, 'client', ScanSearch, { permission: 'analysis:read', inMenu: true }),
  screen('YCRV', 'YCRV', routes.yieldCurves, 'client', ChartSpline, { permission: 'analysis:read', inMenu: true }),
  screen('PORT', 'PORT', routes.portfolio, 'client', Briefcase, { permission: 'portfolios:read', inMenu: true }),
  screen('PUB', 'PUB', routes.library, 'client', BookOpen, { permission: 'research:read', inMenu: true }),
  screen('N', 'N', routes.news, 'client', Newspaper, { permission: 'market:read', inMenu: true }),
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
