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
const PlaceholderPage = lazy(() =>
  import('@/pages/placeholder').then((module) => ({ default: module.PlaceholderPage })),
)

const PAGES: Partial<Record<ScreenTextKey, Page>> = {
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
}

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

/** Page of a screen; screens not built yet show the panels planned in their mockup. */
export function pageOf(screen: ScreenDefinition): Page {
  return PAGES[screen.id] ?? PlaceholderPage
}
