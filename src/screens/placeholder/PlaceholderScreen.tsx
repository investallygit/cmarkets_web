import { useMemo } from 'react'
import { ScreenWorkspace } from '../ScreenWorkspace'
import type { ScreenProps } from '../types'
import { PlannedPanel } from './PlannedPanel'
import { DEFAULT_PLAN, PLAN_LAYOUTS, planLayout, SCREEN_PLANS } from './plans'

const DEFAULT_LAYOUT = planLayout(DEFAULT_PLAN)

/** Screens not built yet: the panel layout of their mockup, with the API each panel will use. */
export function PlaceholderScreen({ screenId }: ScreenProps) {
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
