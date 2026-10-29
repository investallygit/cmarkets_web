import { Suspense } from 'react'
import { useCurrentUser } from '@/features/session'
import { ForbiddenScreen } from '@/screens/status/ForbiddenScreen'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { canAccessScreen } from '../navigation/access'
import type { ScreenDefinition } from '../navigation/screens'

export function ScreenRoute({ screen }: { screen: ScreenDefinition }) {
  const user = useCurrentUser()
  if (!canAccessScreen(user, screen)) return <ForbiddenScreen />

  const Screen = screen.component
  return (
    <Suspense fallback={<PanelLoading />}>
      {/* Several screens share the placeholder component: the key gives each its own state. */}
      <Screen key={screen.id} screenId={screen.id} />
    </Suspense>
  )
}
