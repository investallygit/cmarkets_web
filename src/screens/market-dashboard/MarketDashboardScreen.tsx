import { TriggeredAlertsPanel } from '@/features/alerts'
import { CalendarPanel } from '@/features/calendar'
import {
  IndexChartPanel,
  IndicesPanel,
  SessionSummaryPanel,
  TopMoversPanel,
} from '@/features/market'
import { NewsPanel } from '@/features/news'
import { RatesFxPanel } from '@/features/rates'
import { WatchlistPanel } from '@/features/watchlists'
import { ScreenWorkspace } from '../ScreenWorkspace'
import { MARKET_DASHBOARD_LAYOUT } from './layout'

const PANELS = {
  indices: <IndicesPanel />,
  chart: <IndexChartPanel />,
  movers: <TopMoversPanel />,
  watchlist: <WatchlistPanel />,
  rates: <RatesFxPanel />,
  news: <NewsPanel />,
  calendar: <CalendarPanel />,
  alerts: <TriggeredAlertsPanel />,
  summary: <SessionSummaryPanel />,
}

/** Screen 1, market dashboard (MKT). */
export function MarketDashboardScreen() {
  return <ScreenWorkspace screenId="MKT" defaultLayout={MARKET_DASHBOARD_LAYOUT} panels={PANELS} />
}
