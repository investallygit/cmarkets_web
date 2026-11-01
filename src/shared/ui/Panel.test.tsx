import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { Panel } from './Panel'
import {
  WorkspacePanelContext,
  WorkspaceScreenContext,
  type WorkspacePanelLayout,
  type WorkspaceScreen,
} from './workspacePanel'

const DRAG_HINT = /^Drag the title bar to move the panel/
const LOCKED_HINT = /^The layout of the screen is locked/

/** Four columns at the top left of the grid. */
const IN_GRID: WorkspacePanelLayout = {
  id: 'rates',
  mode: 'grid',
  x: 0,
  y: 0,
  w: 4,
  h: 6,
  columns: 12,
  hasBelow: true,
  move: () => {},
  resize: () => {},
}

const STACKED: WorkspacePanelLayout = {
  id: 'rates',
  mode: 'stacked',
  index: 0,
  count: 3,
  move: () => {},
}

const SCREEN: WorkspaceScreen = {
  locked: false,
  setLocked: () => {},
  canHide: true,
  hide: () => {},
  hidden: [],
  show: () => {},
  canUndo: false,
  canRedo: false,
  undo: () => {},
  redo: () => {},
  openSaved: () => {},
  reset: () => {},
}

function inWorkspace(place: WorkspacePanelLayout, node: ReactNode, locked = false) {
  return (
    <WorkspaceScreenContext.Provider value={{ ...SCREEN, locked }}>
      <WorkspacePanelContext.Provider value={place}>{node}</WorkspacePanelContext.Provider>
    </WorkspaceScreenContext.Provider>
  )
}

const RATES = (
  <Panel title="Rates and FX" code="FX">
    Rates
  </Panel>
)

describe('Panel', () => {
  it('in the grid, shows the mouse a grip and opens its layout menu from the code', () => {
    render(inWorkspace(IN_GRID, RATES))
    // Screen readers have the menu instead.
    expect(screen.getByTitle(DRAG_HINT)).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'FX: layout menu' })).toBeInTheDocument()
  })

  it('stacked, keeps the menu but shows no grip: only the menu moves it', () => {
    render(inWorkspace(STACKED, RATES))
    expect(screen.queryByTitle(DRAG_HINT)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'FX: layout menu' })).toBeInTheDocument()
  })

  it('locked, shows a padlock instead of the grip', () => {
    render(inWorkspace(IN_GRID, RATES, true))
    expect(screen.queryByTitle(DRAG_HINT)).not.toBeInTheDocument()
    expect(screen.getByTitle(LOCKED_HINT)).toHaveAttribute('aria-hidden', 'true')
  })

  it('outside a workspace, shows the code alone and nothing that says the panel moves', () => {
    render(RATES)
    expect(screen.queryByTitle(DRAG_HINT)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('FX')).toBeInTheDocument()
  })
})
