import {
  ArrowRightLeft,
  BadgeCheck,
  Bell,
  BookOpen,
  BookUser,
  Briefcase,
  Calculator,
  CalendarDays,
  ChartLine,
  ChartScatter,
  ChartSpline,
  CreditCard,
  Database,
  FileCheck2,
  FileText,
  Globe,
  HandCoins,
  Handshake,
  History,
  IdCard,
  Layers,
  LayoutDashboard,
  Link2,
  MessagesSquare,
  Newspaper,
  PenLine,
  Rss,
  ScanLine,
  ScanSearch,
  ScrollText,
  Server,
  SquarePen,
  Settings,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
  Wallet,
  Wheat,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleCode, Permission } from '@/shared/api/contracts'
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
  /** Subscription module the screen belongs to (spec section 6); none for research and settings. */
  module?: ModuleCode
  /** Listed in the left menu (spec section 9). */
  inMenu: boolean
  /** The code the left menu shows when it is not the screen's own: NEWS for NEWS NEW (decision 2). */
  menuCode?: string
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
  module?: ModuleCode
  inMenu?: boolean
  routePattern?: string
  menuCode?: string
}

function screen(
  id: ScreenTextKey,
  code: string,
  path: string,
  audience: Audience,
  icon: LucideIcon,
  { permission, module, inMenu = false, routePattern, menuCode }: ScreenOptions = {},
): ScreenDefinition {
  return {
    id,
    code,
    path,
    routePattern,
    menuCode,
    audience,
    permission,
    module,
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
  // Client menu, in the order of screens 10 to 12: MKT, EQS, YCRV, PORT, PUB, NET, MSG, N, ALRT,
  // CFG; a News provider's studio after N (spec section 9), NEWS in the menu (ROADMAP decision 2).
  // ETFS (screen 15) after EQS, BP (16) and BS (17) after YCRV, the entries their mockups light:
  // each has its own since the spec author's answer of 12 November 2026; CMDTY (21), ECO (25) and FX (26) after MKT.
  screen('MKT', 'MKT', routes.market, 'client', LayoutDashboard, { permission: 'market:read', module: 'monitoring', inMenu: true }),
  // CMDTY (screen 21), ECO (screen 25) and FX (screen 26) after MKT, which their mockups light: entries of their own (ROADMAP decision 15).
  screen('CMDTY', 'CMDTY', routes.commodities, 'client', Wheat, { permission: 'market:read', module: 'monitoring', inMenu: true }),
  screen('ECO', 'ECO', routes.eco, 'client', Globe, { permission: 'market:read', module: 'monitoring', inMenu: true }),
  screen('FX', 'FX', routes.fx, 'client', ArrowRightLeft, { permission: 'market:read', module: 'monitoring', inMenu: true }),
  screen('EQS', 'EQS', routes.screener, 'client', ScanSearch, { permission: 'analysis:read', module: 'analysis', inMenu: true }),
  screen('ETFS', 'ETFS', routes.etfScreener, 'client', Layers, { permission: 'analysis:read', module: 'analysis', inMenu: true }),
  screen('YCRV', 'YCRV', routes.yieldCurves, 'client', ChartSpline, { permission: 'analysis:read', module: 'analysis', inMenu: true, routePattern: routes.yieldCurvesBond }),
  screen('BP', 'BP', routes.bondPricing, 'client', Calculator, { permission: 'analysis:read', module: 'analysis', inMenu: true, routePattern: routes.bondPricingBond }),
  screen('BS', 'BS', routes.bondScreener, 'client', ScanLine, { permission: 'analysis:read', module: 'analysis', inMenu: true }),
  // RFQ (screen 22) after BS (ROADMAP decision 15), for the Traders, Managers and CEO of an organisation while the RFQ is
  // on (its CEO reads the organisation's requests, ROADMAP step 44); SVT (screen 27, step 45), the approvals, and TRD, an
  // SVT's trader links, in the SVT's menu (decision 16).
  screen('RFQ', 'RFQ', routes.rfq, 'client', Handshake, { permission: 'rfq:read', inMenu: true }),
  screen('SVT', 'SVT', routes.svt, 'client', BadgeCheck, { permission: 'svt:approve', inMenu: true }),
  screen('TRD', 'TRD', routes.svtTraders, 'client', Link2, { permission: 'svt:approve', inMenu: true }),
  // RFQ AGR (screen 23, ROADMAP step 46): the organisation's agreements under RFQ's tabs, which RFQ's entry lights; AGR in
  // the SVT's menu, the agreements that name its bank (decision 16); the Admin's under its RFQ entry (decision 17).
  screen('RFQAGR', 'RFQ AGR', routes.rfqAgreements, 'client', FileCheck2, { permission: 'rfq:read', menuCode: 'RFQ' }),
  screen('AGR', 'RFQ AGR', routes.svtAgreements, 'client', FileCheck2, { permission: 'svt:approve', inMenu: true, menuCode: 'AGR' }),
  screen('PORT', 'PORT', routes.portfolio, 'client', Briefcase, { permission: 'portfolios:read', module: 'portfolio', inMenu: true, routePattern: routes.portfolioTabs }),
  // OPT (screens 28 and 29) after PORT, which its mockups light: an entry of its own (ROADMAP decision 15).
  screen('OPT', 'OPT', routes.optimizer, 'client', ChartScatter, { permission: 'portfolios:optimize', module: 'portfolio', inMenu: true }),
  screen('PUB', 'PUB', routes.library, 'client', BookOpen, { permission: 'research:read', inMenu: true }),
  screen('NET', 'NET', routes.directory, 'client', BookUser, { permission: 'directory:list', inMenu: true }),
  screen('MSG', 'MSG', routes.messages, 'client', MessagesSquare, { permission: 'messages:write', inMenu: true }),
  screen('N', 'N', routes.news, 'client', Newspaper, { permission: 'market:read', module: 'monitoring', inMenu: true, routePattern: routes.newsTabs }),
  screen('NEWSNEW', 'NEWS NEW', routes.newsStudio, 'client', SquarePen, { permission: 'news:write', inMenu: true, menuCode: 'NEWS' }),
  screen('ALRT', 'ALRT', routes.alerts, 'client', Bell, { permission: 'alerts:write', module: 'monitoring', inMenu: true }),
  screen('CFG', 'CFG', routes.settings, 'client', Settings, { inMenu: true }),

  // Client screens opened from the command bar or from another screen.
  screen('DES', 'DES', routes.security, 'client', FileText, { permission: 'market:read', module: 'monitoring' }),
  // Screen 31, the index profile (fifth version): "BVMAC-A DES"; it lights MKT's entry (ROADMAP decision 44).
  screen('IDX', 'IDX', routes.indexProfile, 'client', ChartLine, { permission: 'market:read', module: 'monitoring' }),
  screen('PUBNEW', 'PUB NEW', routes.publishingStudio, 'client', PenLine, { permission: 'publications:write' }),
  screen('CAL', 'CAL', routes.calendar, 'client', CalendarDays, { permission: 'market:read', module: 'monitoring' }),
  screen('NETME', 'NET ME', routes.networkProfile, 'client', IdCard, { permission: 'directory:profile' }),
  screen('OPTRES', 'OPT RES', routes.optimizerResult, 'client', ChartScatter, { permission: 'portfolios:optimize', module: 'portfolio', menuCode: 'OPT' }),

  // Back-office, Data admin (screen 6).
  screen('DATA', 'DATA', routes.dataSession, 'backoffice', Database, { permission: 'data:import', inMenu: true }),
  screen('IMP', 'IMP', routes.dataImport, 'backoffice', Upload, { permission: 'data:import', inMenu: true }),
  screen('CORR', 'CORR', routes.dataCorrections, 'backoffice', Wrench, { permission: 'data:import', inMenu: true }),
  screen('NEWS', 'NEWS', routes.dataContent, 'backoffice', Newspaper, { permission: 'content:publish', inMenu: true }),
  screen('EODH', 'EODH', routes.dataEodhd, 'backoffice', Server, { permission: 'data:import', inMenu: true }),
  screen('HIST', 'HIST', routes.dataHistory, 'backoffice', History, { permission: 'data:import', inMenu: true }),

  // Back-office, Admin (screen 9).
  screen('USER', 'USER', routes.adminUsers, 'backoffice', Users, { permission: 'users:manage', inMenu: true }),
  // SUBS, the subscriptions (screen 14), then MPAY, the media payments (screen 18), as the spec's menu orders them; the
  // news sources (ROADMAP decision 6), which have no place there, after MPAY.
  screen('SUBS', 'SUBS', routes.adminSubscriptions, 'backoffice', CreditCard, { permission: 'subscriptions:manage', inMenu: true }),
  screen('MPAY', 'MPAY', routes.adminMediaPayments, 'backoffice', HandCoins, { permission: 'news:payments', inMenu: true }),
  screen('SRC', 'SRC', routes.adminSources, 'backoffice', Rss, { permission: 'news:payments', inMenu: true }),
  screen('ANLY', 'ANLY', routes.adminAnalysts, 'backoffice', UserCheck, { permission: 'moderation:manage', inMenu: true }),
  screen('MOD', 'MOD', routes.adminModeration, 'backoffice', ShieldCheck, { permission: 'moderation:manage', inMenu: true }),
  screen('PAY', 'PAY', routes.adminPayouts, 'backoffice', Wallet, { permission: 'payouts:manage', inMenu: true }),
  // The RFQ's back-office (ROADMAP decisions 17 and 26), one entry before CFG: every agreement (screen 23, step 46) at
  // /admin/rfq; the BEAC's daily reporting (screen 24, step 47) at /admin/rfq/reports beside it under the RFQ's tabs, the
  // entry lit on both.
  screen('ADMAGR', 'RFQ AGR', routes.adminRfq, 'backoffice', Handshake, { permission: 'rfq:report', inMenu: true, menuCode: 'RFQ' }),
  screen('RFQREP', 'RFQ REP', routes.adminRfqReports, 'backoffice', Handshake, { permission: 'rfq:report', menuCode: 'RFQ' }),
  screen('ADMCFG', 'CFG', routes.adminSettings, 'backoffice', Settings, { permission: 'settings:manage', inMenu: true }),
  // An employee's own profile and security, CFG's two panels (B72 of ROADMAP step 50: the Data admin and the Admin had none):
  // from the user menu and the command bar, as NET ME.
  screen('MYCFG', 'ME', routes.account, 'backoffice', IdCard),
  screen('AUDT', 'AUDT', routes.adminAudit, 'backoffice', ScrollText, { permission: 'audit:read', inMenu: true }),
]

export function screenById(id: ScreenTextKey): ScreenDefinition {
  const found = SCREENS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown screen ${id}`)
  return found
}
