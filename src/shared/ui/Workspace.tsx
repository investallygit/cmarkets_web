import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import ReactGridLayout from 'react-grid-layout'
import { useElementSize } from '@/shared/lib/useElementSize'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { hasPanelBelow, movePanel, resizePanel } from './workspaceLayout'
import {
  WorkspacePanelContext,
  WorkspaceScreenContext,
  type WorkspacePanelLayout,
  type WorkspaceScreen,
} from './workspacePanel'

/** Position of a panel in grid units (12 columns x 26 rows fill the workspace). */
export interface WorkspaceItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface WorkspacePanel {
  id: string
  node: ReactNode
}

export const WORKSPACE_COLUMNS = 12
/** 26 rows of 23 px fill the workspace at the 1600 x 900 reference resolution (spec section 9). */
const ROWS = 26
const GAP = 8
const MIN_ROW_HEIGHT = 16
const STACKED_ROW_HEIGHT = 22

interface WorkspaceProps {
  /** The panels shown, in grid units. */
  layout: readonly WorkspaceItem[]
  /** The same panels in their order in one column, below 1280 px wide. */
  stacked: readonly string[]
  panels: readonly WorkspacePanel[]
  /** What the menu of every panel offers for the whole screen; locked, nothing drags either. */
  screen: WorkspaceScreen
  onLayoutChange: (layout: readonly WorkspaceItem[]) => void
  /** A step from a panel's layout menu: one change, kept at once rather than after a drag. */
  onLayoutCommit: (layout: readonly WorkspaceItem[]) => void
  /** A step of a stacked panel: it trades places with the one above (-1) or below (1). */
  onStackedMove: (id: string, delta: -1 | 1) => void
}

/**
 * Grid of movable, resizable panels; the row height stretches so the grid fills the screen.
 * Each panel's title bar drags it and its corner resizes it; the layout menu of its title bar
 * does the same one step at a time, without dragging (WorkspacePanelContext), and offers the
 * screen's own steps (WorkspaceScreenContext). Below 1280 px wide the panels stack in one
 * column, where the menu alone changes their order.
 */
export function Workspace({
  layout,
  stacked: order,
  panels,
  screen,
  onLayoutChange,
  onLayoutCommit,
  onStackedMove,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(containerRef)
  // Below 1280 px wide, panels stack in a single column (spec section 9).
  const stacked = useMediaQuery('(max-width: 1279px)')
  const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor((height - GAP * (ROWS + 1)) / ROWS))

  // A hidden panel takes the focus of its menu with it: the next panel's menu gets it.
  const focusAfterHide = useRef<string | null>(null)
  useEffect(() => {
    const id = focusAfterHide.current
    if (id === null) return
    focusAfterHide.current = null
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-panel="${id}"] [data-panel-menu]`)
      ?.focus()
  })
  const screenValue = useMemo<WorkspaceScreen>(
    () => ({
      ...screen,
      hide: (id) => {
        const sequence = stacked
          ? order
          : [...layout].sort((a, b) => a.y - b.y || a.x - b.x).map((item) => item.i)
        const index = sequence.indexOf(id)
        focusAfterHide.current = sequence[index + 1] ?? sequence[index - 1] ?? null
        screen.hide(id)
      },
    }),
    [screen, stacked, order, layout],
  )

  const gridPlace = (item: WorkspaceItem): WorkspacePanelLayout => ({
    ...item,
    id: item.i,
    mode: 'grid',
    columns: WORKSPACE_COLUMNS,
    hasBelow: hasPanelBelow(layout, item.i),
    move: (dx, dy) => onLayoutCommit(movePanel(layout, item.i, dx, dy, WORKSPACE_COLUMNS)),
    resize: (dw, dh) => onLayoutCommit(resizePanel(layout, item.i, dw, dh, WORKSPACE_COLUMNS)),
  })
  const nodes = new Map(panels.map((panel) => [panel.id, panel.node]))

  return (
    <WorkspaceScreenContext.Provider value={screenValue}>
      <div ref={containerRef} className="h-full overflow-x-hidden overflow-y-auto">
        {width > 0 &&
          (stacked ? (
            <div className="flex flex-col gap-2 p-2">
              {order.map((id, index) => (
                <div
                  key={id}
                  data-panel={id}
                  style={{ height: stackedHeight(layout.find((item) => item.i === id)) }}
                >
                  <WorkspacePanelContext.Provider
                    value={{
                      id,
                      mode: 'stacked',
                      index,
                      count: order.length,
                      move: (delta) => onStackedMove(id, delta),
                    }}
                  >
                    {nodes.get(id)}
                  </WorkspacePanelContext.Provider>
                </div>
              ))}
            </div>
          ) : (
            <ReactGridLayout
              width={width}
              layout={layout}
              gridConfig={{
                cols: WORKSPACE_COLUMNS,
                rowHeight,
                margin: [GAP, GAP],
                containerPadding: [GAP, GAP],
              }}
              dragConfig={{
                enabled: !screen.locked,
                handle: '.panel-drag-handle',
                cancel: '.panel-no-drag',
              }}
              resizeConfig={{ enabled: !screen.locked, handles: ['se'] }}
              onLayoutChange={onLayoutChange}
            >
              {layout.map((item) => (
                <div key={item.i} data-panel={item.i}>
                  <WorkspacePanelContext.Provider value={gridPlace(item)}>
                    {nodes.get(item.i)}
                  </WorkspacePanelContext.Provider>
                </div>
              ))}
            </ReactGridLayout>
          ))}
      </div>
    </WorkspaceScreenContext.Provider>
  )
}

/** A stacked panel keeps its height in rows, at least six, at a fixed row height. */
function stackedHeight(item: WorkspaceItem | undefined): number {
  return Math.max(item?.h ?? 0, 6) * (STACKED_ROW_HEIGHT + GAP) - GAP
}
