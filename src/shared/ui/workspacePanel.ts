import { createContext, useContext } from 'react'

/**
 * A panel's place in the workspace, and what the menu of its title bar does with it without
 * dragging (WCAG 2.5.7). In the grid, from 1280 px wide, it moves by columns and rows and
 * resizes; stacked in one column below, it trades places with the panel above or below.
 * Outside a workspace (a dialog), there is none.
 */
export type WorkspacePanelLayout = { id: string } & (
  | {
      mode: 'grid'
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
    }
  | {
      mode: 'stacked'
      /** Its place in the column, from 0, among count panels. */
      index: number
      count: number
      move: (delta: -1 | 1) => void
    }
)

/** What the menu of every panel offers for the whole screen. */
export interface WorkspaceScreen {
  /** Nothing moves, hides or comes back until the user unlocks the layout. */
  locked: boolean
  setLocked: (locked: boolean) => void
  /** The last panel shown stays: hidden, it would take the menu that shows panels back. */
  canHide: boolean
  hide: (id: string) => void
  /** The hidden panels, with the name the menu shows them back by. */
  hidden: readonly { id: string; name: string }[]
  show: (id: string) => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  /** Opens the layouts saved under a name. */
  openSaved: () => void
  /** Back to the screen's default layout. */
  reset: () => void
}

export const WorkspacePanelContext = createContext<WorkspacePanelLayout | null>(null)
export const WorkspaceScreenContext = createContext<WorkspaceScreen | null>(null)

export function useWorkspacePanel(): WorkspacePanelLayout | null {
  return useContext(WorkspacePanelContext)
}

export function useWorkspaceScreen(): WorkspaceScreen | null {
  return useContext(WorkspaceScreenContext)
}
