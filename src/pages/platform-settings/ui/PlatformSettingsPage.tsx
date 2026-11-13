import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import {
  DirectorySettingsPanel,
  MacroSettingsPanel,
  PermissionsPanel,
  PlatformSettingsPanel,
  SpecialtiesPanel,
} from '@/widgets/platform-settings-panels'

/**
 * ADMCFG has no mockup: the settings on the left, the permission matrix on the right, and below
 * it the directory and the messaging, then the specialties; under them all, FX's currencies
 * (step 39), which ECO's countries and tiles join with step 40.
 */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'settings', name: 'platformSettings', x: 0, y: 0, w: 4, h: 26, minW: 4, minH: 10 },
  { i: 'permissions', name: 'permissions', x: 4, y: 0, w: 8, h: 14, minW: 5, minH: 8 },
  { i: 'directory', name: 'directorySettings', x: 4, y: 14, w: 4, h: 12, minW: 3, minH: 8 },
  { i: 'specialties', name: 'specialties', x: 8, y: 14, w: 4, h: 12, minW: 3, minH: 8 },
  { i: 'macro', name: 'macroSettings', x: 0, y: 26, w: 6, h: 16, minW: 3, minH: 8 },
]

/**
 * ADMCFG (spec sections 12 to 15): quotas by account type, the price range, commission and
 * moderation mode of research, the risk-free rate, the permissions of each account type, the
 * defaults and limits of the directory and the messaging, the list of specialties, and the
 * currencies FX shows (spec section 10, /admin/macro/settings).
 */
export function PlatformSettingsPage() {
  const panels = {
    settings: <PlatformSettingsPanel />,
    permissions: <PermissionsPanel />,
    directory: <DirectorySettingsPanel />,
    specialties: <SpecialtiesPanel />,
    macro: <MacroSettingsPanel />,
  }
  return <ScreenWorkspace screenId="ADMCFG" defaultLayout={LAYOUT} panels={panels} />
}
