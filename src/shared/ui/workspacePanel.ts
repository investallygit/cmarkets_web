import { createContext, useContext } from 'react'

/**
 * A panel's place in the workspace grid, and what moves and sizes it without dragging
 * (WCAG 2.5.7): the menu of its title bar. Outside a workspace (a stacked screen, a dialog),
 * there is none.
 */
export interface WorkspacePanelLayout {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  columns: number
  /** A panel lies below this one, so Move down can take its place. */
  hasBelow: boolean
  move: (dx: number, dy: number) => void
  resize: (dw: number, dh: number) => void
  /** Back to the screen's default layout. */
  reset: () => void
}

export const WorkspacePanelContext = createContext<WorkspacePanelLayout | null>(null)

export function useWorkspacePanel(): WorkspacePanelLayout | null {
  return useContext(WorkspacePanelContext)
}
