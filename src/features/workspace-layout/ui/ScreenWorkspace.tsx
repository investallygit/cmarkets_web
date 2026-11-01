import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { historyShortcut, isTypingTarget } from '@/shared/lib/keyboard'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import { Workspace } from '@/shared/ui/Workspace'
import type { WorkspaceScreen } from '@/shared/ui/workspacePanel'
import type { ScreenPanel } from '../lib/arrangement'
import { useWorkspaceLayout } from '../model/useWorkspaceLayout'
import { SavedLayoutsDialog } from './SavedLayoutsDialog'

interface ScreenWorkspaceProps {
  screenId: string
  /** Layout of the mockup, with each panel's name; the user's saved layout overrides it. */
  defaultLayout: readonly ScreenPanel[]
  panels: Readonly<Record<string, ReactNode>>
}

/**
 * A screen is a set of panels in a workspace whose layout is saved per user (spec section 8).
 * Beyond the spec, from the layout menu of any panel: a panel hidden and shown back, a change
 * undone or redone (also Ctrl + Z and Ctrl + Y, ⌘Z and ⇧⌘Z, wherever no text is typed), the
 * layout locked, or kept under a name to come back to.
 */
export function ScreenWorkspace({ screenId, defaultLayout, panels }: ScreenWorkspaceProps) {
  const { t } = useTranslation()
  const workspace = useWorkspaceLayout(screenId, defaultLayout)
  const [savedOpen, setSavedOpen] = useState(false)
  const { locked, undo, redo, hide, show, reset, setLocked, layout, hidden, unread } = workspace

  // Said once per screen: the default shows instead of the user's layout.
  const toldUnread = useRef(new Set<string>())
  useEffect(() => {
    if (!unread || toldUnread.current.has(screenId)) return
    toldUnread.current.add(screenId)
    toast.error(t('workspace.unread'))
  }, [unread, screenId, t])

  const nameOf = useCallback(
    (id: string) => {
      const panel = defaultLayout.find((candidate) => candidate.i === id)
      return panel ? t(`panels.${panel.name}`) : id
    },
    [defaultLayout, t],
  )

  /** Undo or redo, with a word of it: the change may be out of sight. */
  const travel = useCallback(
    (direction: 'undo' | 'redo') => {
      if (locked || !(direction === 'undo' ? undo() : redo())) return false
      toast.info(t(direction === 'undo' ? 'workspace.undone' : 'workspace.redone'))
      return true
    },
    [locked, undo, redo, t],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = historyShortcut(event)
      if (!direction || event.defaultPrevented || isTypingTarget(event.target)) return
      if (travel(direction)) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [travel])

  const screen = useMemo<WorkspaceScreen>(
    () => ({
      locked,
      setLocked: (next) => {
        setLocked(next)
        toast.info(t(next ? 'workspace.lockedToast' : 'workspace.unlockedToast'))
      },
      canHide: layout.length > 1,
      hide: (id) => {
        hide(id)
        toast.info(t('workspace.hiddenToast', { name: nameOf(id) }))
      },
      hidden: hidden.map((id) => ({ id, name: nameOf(id) })),
      show,
      canUndo: workspace.canUndo,
      canRedo: workspace.canRedo,
      undo: () => travel('undo'),
      redo: () => travel('redo'),
      openSaved: () => setSavedOpen(true),
      reset: () => {
        reset()
        toast.info(t('workspace.resetToast'))
      },
    }),
    [
      locked,
      setLocked,
      layout.length,
      hide,
      hidden,
      nameOf,
      show,
      workspace.canUndo,
      workspace.canRedo,
      travel,
      reset,
      t,
    ],
  )

  if (!workspace.isReady) return <PanelLoading />
  return (
    <>
      <Workspace
        layout={layout}
        stacked={workspace.stacked}
        panels={layout.map((item) => ({ id: item.i, node: panels[item.i] }))}
        screen={screen}
        onLayoutChange={workspace.onLayoutChange}
        onLayoutCommit={workspace.onLayoutCommit}
        onStackedMove={workspace.onStackedMove}
      />
      <SavedLayoutsDialog
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        saved={workspace.saved}
        locked={locked}
        unread={unread}
        onSave={workspace.saveAs}
        onApply={workspace.apply}
        onDelete={workspace.remove}
      />
    </>
  )
}
