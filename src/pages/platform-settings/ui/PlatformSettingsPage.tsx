import { ScreenWorkspace } from '@/features/workspace-layout'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { PermissionsPanel, PlatformSettingsPanel } from '@/widgets/platform-settings-panels'

/** ADMCFG has no mockup: the settings on the left, the permission matrix on the right. */
const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'settings', x: 0, y: 0, w: 5, h: 26, minW: 4, minH: 10 },
  { i: 'permissions', x: 5, y: 0, w: 7, h: 26, minW: 5, minH: 10 },
]

/**
 * ADMCFG (spec sections 12 to 14): quotas by account type, the price range, commission and
 * moderation mode of research, the risk-free rate, and the permissions of each account type.
 */
export function PlatformSettingsPage() {
  const panels = { settings: <PlatformSettingsPanel />, permissions: <PermissionsPanel /> }
  return <ScreenWorkspace screenId="ADMCFG" defaultLayout={LAYOUT} panels={panels} />
}
