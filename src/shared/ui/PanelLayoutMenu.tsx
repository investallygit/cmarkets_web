import type { TFunction } from 'i18next'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bookmark,
  ChevronsDownUp,
  ChevronsLeftRight,
  ChevronsRightLeft,
  ChevronsUpDown,
  Eye,
  EyeOff,
  LayoutGrid,
  Lock,
  LockOpen,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REDO_SHORTCUT, UNDO_SHORTCUT } from '@/shared/lib/keyboard'
import { ContextMenu } from './ContextMenu'
import type { MenuItem } from './menu'
import { useWorkspacePanel, useWorkspaceScreen, type WorkspacePanelLayout } from './workspacePanel'

interface PanelLayoutMenuProps {
  /** The function code of the title bar, e.g. "MKT"; the button shows it. */
  code?: string
  /** Id of the panel's title, which names the panel to screen readers. */
  titleId: string
}

/**
 * The function code at the right of a panel's title bar. In a workspace, a button whose menu
 * moves and sizes the panel one grid step at a time, or one place up or down once the panels
 * stack: what dragging the title bar and the corner does, without dragging (WCAG 2.5.7) and from
 * the keyboard. It also hides the panel and shows hidden ones back, undoes and redoes, locks the
 * layout, keeps it under a name or brings the screen's default back. Elsewhere, the code alone.
 */
export function PanelLayoutMenu({ code, titleId }: PanelLayoutMenuProps) {
  const { t } = useTranslation()
  const panel = useWorkspacePanel()
  const screen = useWorkspaceScreen()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const close = useCallback(() => setPosition(null), [])
  // A stacked panel that trades places is put back in the page, which takes the focus off its
  // button: it gets it back once the panels are in their new order.
  const refocus = useRef(false)
  useLayoutEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    if (document.activeElement !== buttonRef.current) buttonRef.current?.focus()
  })

  if (!panel || !screen) return code ? <span>{code}</span> : null

  const { locked } = screen
  const step = (action: () => void) => () => {
    refocus.current = true
    action()
  }
  const items: MenuItem[] = [
    {
      id: 'layout',
      kind: 'label',
      label: t(locked ? 'workspace.layoutLocked' : 'workspace.layout'),
    },
    ...panelSteps(panel, locked, t, step),
    { id: 'hide-separator', label: '', kind: 'separator' },
    {
      id: 'hide',
      label: t('workspace.hide'),
      icon: EyeOff,
      disabled: locked || !screen.canHide,
      onSelect: () => screen.hide(panel.id),
    },
    ...screen.hidden.map(({ id, name }): MenuItem => ({
      id: `show-${id}`,
      label: t('workspace.show', { name }),
      icon: Eye,
      disabled: locked,
      onSelect: () => screen.show(id),
    })),
    { id: 'history-separator', label: '', kind: 'separator' },
    {
      id: 'undo',
      label: t('workspace.undo'),
      icon: Undo2,
      shortcut: UNDO_SHORTCUT,
      disabled: locked || !screen.canUndo,
      onSelect: screen.undo,
    },
    {
      id: 'redo',
      label: t('workspace.redo'),
      icon: Redo2,
      shortcut: REDO_SHORTCUT,
      disabled: locked || !screen.canRedo,
      onSelect: screen.redo,
    },
    { id: 'screen-separator', label: '', kind: 'separator' },
    {
      id: 'lock',
      label: t(locked ? 'workspace.unlock' : 'workspace.lock'),
      icon: locked ? LockOpen : Lock,
      onSelect: () => screen.setLocked(!locked),
    },
    { id: 'saved', label: t('workspace.saved'), icon: Bookmark, onSelect: screen.openSaved },
    {
      id: 'reset',
      label: t('workspace.reset'),
      icon: RotateCcw,
      disabled: locked,
      onSelect: screen.reset,
    },
  ]

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-panel-menu
        aria-haspopup="menu"
        aria-expanded={position !== null}
        aria-label={code ? t('workspace.panelMenuOf', { code }) : t('workspace.panelMenu')}
        aria-describedby={titleId}
        title={t('workspace.hint')}
        onClick={(event) => {
          if (position) return close()
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({ x: rect.right, y: rect.bottom + 4 })
        }}
        className="panel-no-drag inline-flex items-center justify-center hover:text-primary"
      >
        {code ?? <LayoutGrid aria-hidden className="size-3" />}
      </button>
      {position && (
        <ContextMenu
          align="end"
          x={position.x}
          y={position.y}
          items={items}
          onClose={close}
          ignoreRef={buttonRef}
        />
      )}
    </>
  )
}

/** The steps of the panel itself: by columns and rows in the grid, by places once stacked. */
function panelSteps(
  panel: WorkspacePanelLayout,
  locked: boolean,
  t: TFunction,
  step: (action: () => void) => () => void,
): MenuItem[] {
  if (panel.mode === 'stacked') {
    return [
      {
        id: 'up',
        label: t('workspace.moveUp'),
        icon: ArrowUp,
        disabled: locked || panel.index === 0,
        onSelect: step(() => panel.move(-1)),
      },
      {
        id: 'down',
        label: t('workspace.moveDown'),
        icon: ArrowDown,
        disabled: locked || panel.index === panel.count - 1,
        onSelect: step(() => panel.move(1)),
      },
    ]
  }
  const atRight = panel.x + panel.w >= panel.columns
  return [
    {
      id: 'left',
      label: t('workspace.moveLeft'),
      icon: ArrowLeft,
      disabled: locked || panel.x === 0,
      onSelect: () => panel.move(-1, 0),
    },
    {
      id: 'right',
      label: t('workspace.moveRight'),
      icon: ArrowRight,
      disabled: locked || atRight,
      onSelect: () => panel.move(1, 0),
    },
    {
      id: 'up',
      label: t('workspace.moveUp'),
      icon: ArrowUp,
      disabled: locked || panel.y === 0,
      onSelect: () => panel.move(0, -1),
    },
    {
      id: 'down',
      label: t('workspace.moveDown'),
      icon: ArrowDown,
      disabled: locked || !panel.hasBelow,
      onSelect: () => panel.move(0, 1),
    },
    { id: 'size-separator', label: '', kind: 'separator' },
    {
      id: 'wider',
      label: t('workspace.wider'),
      icon: ChevronsLeftRight,
      disabled: locked || atRight,
      onSelect: () => panel.resize(1, 0),
    },
    {
      id: 'narrower',
      label: t('workspace.narrower'),
      icon: ChevronsRightLeft,
      disabled: locked || panel.w <= (panel.minW ?? 1),
      onSelect: () => panel.resize(-1, 0),
    },
    {
      id: 'taller',
      label: t('workspace.taller'),
      icon: ChevronsUpDown,
      disabled: locked,
      onSelect: () => panel.resize(0, 1),
    },
    {
      id: 'shorter',
      label: t('workspace.shorter'),
      icon: ChevronsDownUp,
      disabled: locked || panel.h <= (panel.minH ?? 1),
      onSelect: () => panel.resize(0, -1),
    },
  ]
}
