import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronsDownUp,
  ChevronsLeftRight,
  ChevronsRightLeft,
  ChevronsUpDown,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ContextMenu } from './ContextMenu'
import type { MenuItem } from './menu'
import { useWorkspacePanel } from './workspacePanel'

const MENU_WIDTH = 216

interface PanelLayoutMenuProps {
  /** The function code of the title bar, e.g. "MKT"; the button shows it. */
  code?: string
  /** Id of the panel's title, which names the panel to screen readers. */
  titleId: string
}

/**
 * The function code at the right of a panel's title bar. In a workspace, a button whose menu
 * moves and sizes the panel one grid step at a time, or brings back the screen's default layout:
 * what dragging the title bar and the corner does, without dragging (WCAG 2.5.7) and from the
 * keyboard. Elsewhere, the code alone.
 */
export function PanelLayoutMenu({ code, titleId }: PanelLayoutMenuProps) {
  const { t } = useTranslation()
  const layout = useWorkspacePanel()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const close = useCallback(() => setPosition(null), [])

  if (!layout) return code ? <span>{code}</span> : null

  const atRight = layout.x + layout.w >= layout.columns
  const items: MenuItem[] = [
    { id: 'layout', kind: 'label', label: t('workspace.layout') },
    {
      id: 'left',
      label: t('workspace.moveLeft'),
      icon: ArrowLeft,
      disabled: layout.x === 0,
      onSelect: () => layout.move(-1, 0),
    },
    {
      id: 'right',
      label: t('workspace.moveRight'),
      icon: ArrowRight,
      disabled: atRight,
      onSelect: () => layout.move(1, 0),
    },
    {
      id: 'up',
      label: t('workspace.moveUp'),
      icon: ArrowUp,
      disabled: layout.y === 0,
      onSelect: () => layout.move(0, -1),
    },
    {
      id: 'down',
      label: t('workspace.moveDown'),
      icon: ArrowDown,
      disabled: !layout.hasBelow,
      onSelect: () => layout.move(0, 1),
    },
    { id: 'size-separator', label: '', kind: 'separator' },
    {
      id: 'wider',
      label: t('workspace.wider'),
      icon: ChevronsLeftRight,
      disabled: atRight,
      onSelect: () => layout.resize(1, 0),
    },
    {
      id: 'narrower',
      label: t('workspace.narrower'),
      icon: ChevronsRightLeft,
      disabled: layout.w <= (layout.minW ?? 1),
      onSelect: () => layout.resize(-1, 0),
    },
    {
      id: 'taller',
      label: t('workspace.taller'),
      icon: ChevronsUpDown,
      onSelect: () => layout.resize(0, 1),
    },
    {
      id: 'shorter',
      label: t('workspace.shorter'),
      icon: ChevronsDownUp,
      disabled: layout.h <= (layout.minH ?? 1),
      onSelect: () => layout.resize(0, -1),
    },
    { id: 'reset-separator', label: '', kind: 'separator' },
    { id: 'reset', label: t('workspace.reset'), icon: RotateCcw, onSelect: layout.reset },
  ]

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={position !== null}
        aria-label={code ? t('workspace.panelMenuOf', { code }) : t('workspace.panelMenu')}
        aria-describedby={titleId}
        title={t('workspace.hint')}
        onClick={(event) => {
          if (position) return close()
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({ x: rect.right - MENU_WIDTH, y: rect.bottom + 4 })
        }}
        className="panel-no-drag inline-flex items-center justify-center hover:text-primary"
      >
        {code ?? <LayoutGrid aria-hidden className="size-3" />}
      </button>
      {position && (
        <ContextMenu
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
