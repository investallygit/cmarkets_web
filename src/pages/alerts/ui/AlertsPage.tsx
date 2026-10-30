import { useState } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { AlertHistoryPanel } from '@/widgets/alert-history-panel'
import { AlertListPanel } from '@/widgets/alert-list-panel'
import { ALERTS_LAYOUT } from '../config/layout'

/**
 * ALRT screen (spec section 5): the user's alerts with their on / off switch, and the history of
 * the alerts that went off. A click in the history points at the alert behind it.
 */
export function AlertsPage() {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const panels = {
    alerts: <AlertListPanel selectedId={selectedAlertId} onSelect={setSelectedAlertId} />,
    history: <AlertHistoryPanel onSelectAlert={setSelectedAlertId} />,
  }
  return <ScreenWorkspace screenId="ALRT" defaultLayout={ALERTS_LAYOUT} panels={panels} />
}
