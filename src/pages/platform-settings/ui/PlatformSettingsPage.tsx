import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import {
  DirectorySettingsPanel,
  PermissionsPanel,
  PlatformSettingsPanel,
  SpecialtiesPanel,
} from '@/widgets/platform-settings-panels'

/**
 * ADMCFG has no mockup: the settings on the left, the permission matrix on the right, and below
 * it the directory and the messaging, then the specialties.
 */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'settings', name: 'platformSettings', x: 0, y: 0, w: 4, h: 26, minW: 4, minH: 10 },
  { i: 'permissions', name: 'permissions', x: 4, y: 0, w: 8, h: 14, minW: 5, minH: 8 },
  { i: 'directory', name: 'directorySettings', x: 4, y: 14, w: 4, h: 12, minW: 3, minH: 8 },
  { i: 'specialties', name: 'specialties', x: 8, y: 14, w: 4, h: 12, minW: 3, minH: 8 },
]

/**
 * ADMCFG (spec sections 12 to 15): quotas by account type, the price range, commission and
 * moderation mode of research, the risk-free rate, the permissions of each account type, the
 * defaults and limits of the directory and the messaging, and the list of specialties.
 */
export function PlatformSettingsPage() {
  const panels = {
    settings: <PlatformSettingsPanel />,
    permissions: <PermissionsPanel />,
    directory: <DirectorySettingsPanel />,
    specialties: <SpecialtiesPanel />,
  }
  return <ScreenWorkspace screenId="ADMCFG" defaultLayout={LAYOUT} panels={panels} />
}
