import { useProfileEditor } from '@/features/edit-network-profile'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { CardPreviewPanel, MyProfilePanel, VisibilityPanel } from '@/widgets/network-profile-panels'
import { NETWORK_PROFILE_LAYOUT } from '../config/layout'

/**
 * NET ME, my profile, visibility and contact (spec sections 9 and 15, screen 12): the profile
 * the directory lists, who sees it and who may write, and the card as others see it. The three
 * panels share the changes, which one SAVE sends.
 */
export function NetworkProfilePage() {
  const { editor, error, retry } = useProfileEditor()
  if (!editor) return error ? <PanelError error={error} onRetry={retry} /> : <PanelLoading />
  const panels = {
    profile: <MyProfilePanel editor={editor} />,
    visibility: <VisibilityPanel editor={editor} />,
    preview: <CardPreviewPanel editor={editor} />,
  }
  return <ScreenWorkspace screenId="NETME" defaultLayout={NETWORK_PROFILE_LAYOUT} panels={panels} />
}
