import { ScreenWorkspace } from '@/features/workspace-layout'
import { CalendarPanel } from '@/widgets/calendar-panel'
import { IndexChartPanel } from '@/widgets/index-chart-panel'
import { IndicesPanel } from '@/widgets/indices-panel'
import { NewsPanel } from '@/widgets/news-panel'
import { RatesFxPanel } from '@/widgets/rates-fx-panel'
import { SessionSummaryPanel } from '@/widgets/session-summary-panel'
import { TopMoversPanel } from '@/widgets/top-movers-panel'
import { TriggeredAlertsPanel } from '@/widgets/triggered-alerts-panel'
import { WatchlistPanel } from '@/widgets/watchlist-panel'
import { MARKET_DASHBOARD_LAYOUT } from '../config/layout'
import { useIndexSelection } from '../model/indexSelection'

// A click in the Indices panel picks the index of the central chart.
function DashboardIndices() {
  const indexCode = useIndexSelection((state) => state.indexCode)
  const selectIndex = useIndexSelection((state) => state.selectIndex)
  return <IndicesPanel selectedCode={indexCode} onSelect={selectIndex} />
}

function DashboardIndexChart() {
  const indexCode = useIndexSelection((state) => state.indexCode)
  return <IndexChartPanel indexCode={indexCode} />
}

const PANELS = {
  indices: <DashboardIndices />,
  chart: <DashboardIndexChart />,
  movers: <TopMoversPanel />,
  watchlist: <WatchlistPanel />,
  rates: <RatesFxPanel />,
  news: <NewsPanel />,
  calendar: <CalendarPanel />,
  alerts: <TriggeredAlertsPanel />,
  summary: <SessionSummaryPanel />,
}

/** Screen 1, market dashboard (MKT). */
export function MarketDashboardPage() {
  return <ScreenWorkspace screenId="MKT" defaultLayout={MARKET_DASHBOARD_LAYOUT} panels={PANELS} />
}
