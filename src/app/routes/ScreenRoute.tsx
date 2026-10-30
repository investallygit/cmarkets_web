import { Suspense, type ComponentType } from 'react'
import { canAccessScreen, lockedModule, ModuleLocked, useCurrentUser } from '@/entities/session'
import { ForbiddenPage } from '@/pages/status'
import type { ScreenDefinition, ScreenProps } from '@/shared/routes/screens'
import { PanelLoading } from '@/shared/ui/StatusViews'

interface ScreenRouteProps {
  screen: ScreenDefinition
  page: ComponentType<ScreenProps>
}

export function ScreenRoute({ screen, page: Page }: ScreenRouteProps) {
  const user = useCurrentUser()
  if (!canAccessScreen(user, screen)) return <ForbiddenPage />
  // A screen outside the user's plan offers the plans instead (spec section 6).
  const locked = lockedModule(user, screen)
  if (locked) return <ModuleLocked module={locked} />

  return (
    <Suspense fallback={<PanelLoading />}>
      {/* Several screens share the placeholder page: the key gives each its own state. */}
      <Page key={screen.id} screenId={screen.id} />
    </Suspense>
  )
}
