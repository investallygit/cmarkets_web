import type { ReactNode } from 'react'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { Workspace, type WorkspaceItem } from '@/shared/ui/Workspace'
import { useWorkspaceLayout } from '../model/useWorkspaceLayout'

interface ScreenWorkspaceProps {
  screenId: string
  /** Layout of the mockup; the user's saved layout overrides it. */
  defaultLayout: readonly WorkspaceItem[]
  panels: Readonly<Record<string, ReactNode>>
}

/** A screen is a set of panels in a workspace whose layout is saved per user (spec section 8). */
export function ScreenWorkspace({ screenId, defaultLayout, panels }: ScreenWorkspaceProps) {
  const { layout, isReady, onLayoutChange } = useWorkspaceLayout(screenId, defaultLayout)
  if (!isReady) return <PanelLoading />
  return (
    <Workspace
      layout={layout}
      panels={layout.map((item) => ({ id: item.i, node: panels[item.i] }))}
      onLayoutChange={onLayoutChange}
    />
  )
}
