import { useMemo } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { ScreenProps } from '@/shared/routes/screens'
import { DEFAULT_PLAN, PLAN_LAYOUTS, planLayout, SCREEN_PLANS } from '../config/plans'
import { PlannedPanel } from './PlannedPanel'

const DEFAULT_LAYOUT = planLayout(DEFAULT_PLAN)

/** Screens not built yet: the panel layout of their mockup, with the API each panel will use. */
export function PlaceholderPage({ screenId }: ScreenProps) {
  const plans = SCREEN_PLANS[screenId] ?? DEFAULT_PLAN
  const panels = useMemo(
    () =>
      Object.fromEntries(
        plans.map((plan) => [plan.id, <PlannedPanel key={plan.id} plan={plan} />]),
      ),
    [plans],
  )

  return (
    <ScreenWorkspace
      screenId={screenId}
      defaultLayout={PLAN_LAYOUTS[screenId] ?? DEFAULT_LAYOUT}
      panels={panels}
    />
  )
}
