import { cloneLayout, getLayoutItem, moveElement, verticalCompactor } from 'react-grid-layout'
import type { WorkspaceItem } from './Workspace'

type Box = Pick<WorkspaceItem, 'i' | 'x' | 'y' | 'w' | 'h'>

const sharesColumns = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w

/** The nearest panel above this one, in some of its columns. */
function panelAbove(layout: readonly Box[], item: Box): Box | undefined {
  return layout
    .filter(
      (other) => other.i !== item.i && other.y + other.h <= item.y && sharesColumns(other, item),
    )
    .sort((a, b) => b.y + b.h - (a.y + a.h))[0]
}

/** The nearest panel below this one, in some of its columns. */
function panelBelow(layout: readonly Box[], item: Box): Box | undefined {
  return layout
    .filter(
      (other) => other.i !== item.i && other.y >= item.y + item.h && sharesColumns(other, item),
    )
    .sort((a, b) => a.y - b.y)[0]
}

/**
 * The layout with one panel moved, the others making way as for a drag: a column to the left or
 * to the right; up or down, past the nearest panel there, which takes its place. The grid packs
 * panels upwards, so a step of one row would fall back where it was.
 */
export function movePanel(
  layout: readonly WorkspaceItem[],
  id: string,
  dx: number,
  dy: number,
  columns: number,
): WorkspaceItem[] {
  const item = layout.find((candidate) => candidate.i === id)
  if (!item) return [...layout]
  if (dy > 0) {
    // Down: the panel below goes up past this one.
    const below = panelBelow(layout, item)
    return below ? movePanel(layout, below.i, 0, -1, columns) : [...layout]
  }
  const next = cloneLayout(layout)
  const moved = getLayoutItem(next, id)
  if (!moved) return next
  const x = Math.min(Math.max(0, moved.x + dx), columns - moved.w)
  // Up: to the top of the panel above, where a drag would make it give way.
  const y = dy < 0 ? (panelAbove(next, moved)?.y ?? moved.y) : moved.y
  return [
    ...verticalCompactor.compact(
      moveElement(next, moved, x, y, true, false, 'vertical', columns),
      columns,
    ),
  ]
}

/** The layout with one panel resized by grid steps, within its minimum size and the grid. */
export function resizePanel(
  layout: readonly WorkspaceItem[],
  id: string,
  dw: number,
  dh: number,
  columns: number,
): WorkspaceItem[] {
  const next = cloneLayout(layout)
  const item = getLayoutItem(next, id)
  if (!item) return next
  item.w = Math.min(Math.max(item.minW ?? 1, item.w + dw), columns - item.x)
  item.h = Math.max(item.minH ?? 1, item.h + dh)
  // The panels it now covers move down out of its way.
  return [...verticalCompactor.compact(next, columns)]
}

/** Whether a panel lies below this one, in some of its columns: Move down takes its place. */
export function hasPanelBelow(layout: readonly WorkspaceItem[], id: string): boolean {
  const item = layout.find((candidate) => candidate.i === id)
  return item !== undefined && panelBelow(layout, item) !== undefined
}
