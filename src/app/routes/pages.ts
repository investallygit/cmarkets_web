import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ScreenTextKey } from '@/shared/i18n'
import type { ScreenDefinition, ScreenProps } from '@/shared/routes/screens'

type Page = LazyExoticComponent<ComponentType<ScreenProps>>

// Each page is its own chunk, loaded on first visit.
const MarketDashboardPage = lazy(() =>
  import('@/pages/market-dashboard').then((module) => ({ default: module.MarketDashboardPage })),
)
const SecurityProfilePage = lazy(() =>
  import('@/pages/security-profile').then((module) => ({ default: module.SecurityProfilePage })),
)
const EquityScreenerPage = lazy(() =>
  import('@/pages/equity-screener').then((module) => ({ default: module.EquityScreenerPage })),
)
const YieldCurvesPage = lazy(() =>
  import('@/pages/yield-curves').then((module) => ({ default: module.YieldCurvesPage })),
)
const PortfolioPage = lazy(() =>
  import('@/pages/portfolio').then((module) => ({ default: module.PortfolioPage })),
)
const ResearchLibraryPage = lazy(() =>
  import('@/pages/research-library').then((module) => ({ default: module.ResearchLibraryPage })),
)
const PublishingStudioPage = lazy(() =>
  import('@/pages/publishing-studio').then((module) => ({ default: module.PublishingStudioPage })),
)
const NewsPage = lazy(() => import('@/pages/news').then((module) => ({ default: module.NewsPage })))
const MarketCalendarPage = lazy(() =>
  import('@/pages/market-calendar').then((module) => ({ default: module.MarketCalendarPage })),
)
const AlertsPage = lazy(() =>
  import('@/pages/alerts').then((module) => ({ default: module.AlertsPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings').then((module) => ({ default: module.SettingsPage })),
)
const NetworkProfilePage = lazy(() =>
  import('@/pages/network-profile').then((module) => ({ default: module.NetworkProfilePage })),
)
// The back-office of the Data admin (screen 6).
const DataImportPage = lazy(() =>
  import('@/pages/data-import').then((module) => ({ default: module.DataImportPage })),
)
const DataSessionPage = lazy(() =>
  import('@/pages/data-session').then((module) => ({ default: module.DataSessionPage })),
)
const UploadHistoryPage = lazy(() =>
  import('@/pages/upload-history').then((module) => ({ default: module.UploadHistoryPage })),
)
const DataCorrectionsPage = lazy(() =>
  import('@/pages/data-corrections').then((module) => ({ default: module.DataCorrectionsPage })),
)
const ContentPage = lazy(() =>
  import('@/pages/content').then((module) => ({ default: module.ContentPage })),
)
const EodhdPage = lazy(() =>
  import('@/pages/eodhd').then((module) => ({ default: module.EodhdPage })),
)
// The Admin's screens (screen 9).
const AdminUsersPage = lazy(() =>
  import('@/pages/admin-users').then((module) => ({ default: module.AdminUsersPage })),
)
const AnalystRequestsPage = lazy(() =>
  import('@/pages/analyst-requests').then((module) => ({ default: module.AnalystRequestsPage })),
)
const ModerationPage = lazy(() =>
  import('@/pages/moderation').then((module) => ({ default: module.ModerationPage })),
)
const PayoutsPage = lazy(() =>
  import('@/pages/payouts').then((module) => ({ default: module.PayoutsPage })),
)
const PlatformSettingsPage = lazy(() =>
  import('@/pages/platform-settings').then((module) => ({ default: module.PlatformSettingsPage })),
)
const AuditLogPage = lazy(() =>
  import('@/pages/audit-log').then((module) => ({ default: module.AuditLogPage })),
)

const PAGES: Record<ScreenTextKey, Page> = {
  MKT: MarketDashboardPage,
  DES: SecurityProfilePage,
  EQS: EquityScreenerPage,
  YCRV: YieldCurvesPage,
  YAS: YieldCurvesPage,
  PORT: PortfolioPage,
  PUB: ResearchLibraryPage,
  PUBNEW: PublishingStudioPage,
  N: NewsPage,
  CAL: MarketCalendarPage,
  ALRT: AlertsPage,
  CFG: SettingsPage,
  NETME: NetworkProfilePage,
  IMP: DataImportPage,
  DATA: DataSessionPage,
  HIST: UploadHistoryPage,
  EODH: EodhdPage,
  CORR: DataCorrectionsPage,
  NEWS: ContentPage,
  USER: AdminUsersPage,
  ANLY: AnalystRequestsPage,
  MOD: ModerationPage,
  PAY: PayoutsPage,
  ADMCFG: PlatformSettingsPage,
  AUDT: AuditLogPage,
}

/** The home page, open to visitors: the product, the markets, the plans. */
export const HomePage = lazy(() =>
  import('@/pages/home').then((module) => ({ default: module.HomePage })),
)

// The login pages share a chunk, loaded before the session.
export const LoginPage = lazy(() =>
  import('@/pages/auth').then((module) => ({ default: module.LoginPage })),
)
export const SignUpPage = lazy(() =>
  import('@/pages/auth').then((module) => ({ default: module.SignUpPage })),
)
export const PasswordResetPage = lazy(() =>
  import('@/pages/auth').then((module) => ({ default: module.PasswordResetPage })),
)

/** Prototype only: the shared UI components on one page, at /_kit. */
export const UiKitPage = lazy(() =>
  import('@/pages/ui-kit').then((module) => ({ default: module.UiKitPage })),
)

/** Page of a screen. */
export function pageOf(screen: ScreenDefinition): Page {
  return PAGES[screen.id]
}
