import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { EodhdPanel, EodhdRunsPanel } from '@/widgets/eodhd-panel'

const LAYOUT: readonly ScreenPanel[] = [
  { i: 'connector', name: 'eodhd', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 8 },
  { i: 'runs', name: 'eodhdRuns', x: 4, y: 0, w: 8, h: 26, minW: 4, minH: 8 },
]

/** EODH: the EODHD connector of screen 6 in detail, and its bulk loads of the last 7 days. */
export function EodhdPage() {
  const panels = { connector: <EodhdPanel detailed />, runs: <EodhdRunsPanel /> }
  return <ScreenWorkspace screenId="EODH" defaultLayout={LAYOUT} panels={panels} />
}
