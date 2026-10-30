import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ScreenTextKey } from '@/shared/i18n'
import type { ScreenDefinition, ScreenProps } from '@/shared/routes/screens'

type Page = LazyExoticComponent<ComponentType<ScreenProps>>

// Each page is its own chunk, loaded on first visit.
const MarketDashboardPage = lazy(() =>
  import('@/pages/market-dashboard').then((module) => ({ default: module.MarketDashboardPage })),
)
const PlaceholderPage = lazy(() =>
  import('@/pages/placeholder').then((module) => ({ default: module.PlaceholderPage })),
)

const PAGES: Partial<Record<ScreenTextKey, Page>> = {
  MKT: MarketDashboardPage,
}

/** Page of a screen; screens not built yet show the panels planned in their mockup. */
export function pageOf(screen: ScreenDefinition): Page {
  return PAGES[screen.id] ?? PlaceholderPage
}
