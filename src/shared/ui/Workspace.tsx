import { useRef, type ReactNode } from 'react'
import ReactGridLayout from 'react-grid-layout'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

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

const COLUMNS = 12
/** 26 rows of 23 px fill the workspace at the 1600 x 900 reference resolution (spec section 9). */
const ROWS = 26
const GAP = 8
const MIN_ROW_HEIGHT = 16
const STACKED_ROW_HEIGHT = 22

interface WorkspaceProps {
  layout: readonly WorkspaceItem[]
  panels: readonly WorkspacePanel[]
  onLayoutChange: (layout: readonly WorkspaceItem[]) => void
}

/** Grid of movable, resizable panels; the row height stretches so the grid fills the screen. */
export function Workspace({ layout, panels, onLayoutChange }: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(containerRef)
  // Below 1280 px wide, panels stack in a single column (spec section 9).
  const stacked = useMediaQuery('(max-width: 1279px)')
  const rowHeight = Math.max(MIN_ROW_HEIGHT, Math.floor((height - GAP * (ROWS + 1)) / ROWS))

  return (
    <div ref={containerRef} className="h-full overflow-x-hidden overflow-y-auto">
      {width > 0 &&
        (stacked ? (
          <StackedPanels layout={layout} panels={panels} />
        ) : (
          <ReactGridLayout
            width={width}
            layout={layout}
            gridConfig={{
              cols: COLUMNS,
              rowHeight,
              margin: [GAP, GAP],
              containerPadding: [GAP, GAP],
            }}
            dragConfig={{ handle: '.panel-drag-handle', cancel: '.panel-no-drag' }}
            resizeConfig={{ handles: ['se'] }}
            onLayoutChange={onLayoutChange}
          >
            {panels.map((panel) => (
              <div key={panel.id}>{panel.node}</div>
            ))}
          </ReactGridLayout>
        ))}
    </div>
  )
}

function StackedPanels({ layout, panels }: Omit<WorkspaceProps, 'onLayoutChange'>) {
  const nodes = new Map(panels.map((panel) => [panel.id, panel.node]))
  const ordered = [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
  return (
    <div className="flex flex-col gap-2 p-2">
      {ordered.map((item) => (
        <div
          key={item.i}
          style={{ height: Math.max(item.h, 6) * (STACKED_ROW_HEIGHT + GAP) - GAP }}
        >
          {nodes.get(item.i)}
        </div>
      ))}
    </div>
  )
}
