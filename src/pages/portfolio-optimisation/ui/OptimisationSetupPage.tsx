import { ScenarioBar } from '@/features/save-opt-scenario'
import { ScreenWorkspace } from '@/features/workspace-layout'
import {
  CorrelationsPanel,
  ObjectivePanel,
  PreRunChecksPanel,
  UniversePanel,
} from '@/widgets/opt-setup-panels'
import { OPT_SETUP_LAYOUT } from '../config/layout'
import { useOptimizerSource } from '../model/useOptimizerSource'
import { OptimisationTabs } from './OptimisationTabs'

/**
 * Screen 28, OPT (spec section 9): the investment universe, the objective with its constraints and
 * settings, the correlations and the pre-run checks; the saved scenarios above them.
 */
export function OptimisationSetupPage() {
  useOptimizerSource()
  const panels = {
    universe: <UniversePanel />,
    objective: <ObjectivePanel />,
    correlations: <CorrelationsPanel />,
    checks: <PreRunChecksPanel />,
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-2 pt-2">
        <OptimisationTabs />
        <ScenarioBar />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="OPT" defaultLayout={OPT_SETUP_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
