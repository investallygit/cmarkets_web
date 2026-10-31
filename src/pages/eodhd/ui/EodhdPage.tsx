import { ScreenWorkspace } from '@/features/workspace-layout'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { EodhdPanel, EodhdRunsPanel } from '@/widgets/eodhd-panel'

const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'connector', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 8 },
  { i: 'runs', x: 4, y: 0, w: 8, h: 26, minW: 4, minH: 8 },
]

/** EODH: the EODHD connector of screen 6 in detail, and its bulk loads of the last 7 days. */
export function EodhdPage() {
  const panels = { connector: <EodhdPanel detailed />, runs: <EodhdRunsPanel /> }
  return <ScreenWorkspace screenId="EODH" defaultLayout={LAYOUT} panels={panels} />
}
