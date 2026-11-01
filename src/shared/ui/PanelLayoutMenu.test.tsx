import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PanelLayoutMenu } from './PanelLayoutMenu'
import {
  WorkspacePanelContext,
  WorkspaceScreenContext,
  type WorkspacePanelLayout,
  type WorkspaceScreen,
} from './workspacePanel'

const IN_GRID: WorkspacePanelLayout = {
  id: 'rates',
  mode: 'grid',
  x: 0,
  y: 0,
  w: 4,
  h: 6,
  columns: 12,
  hasBelow: true,
  move: vi.fn(),
  resize: vi.fn(),
}

function screenOf(changes: Partial<WorkspaceScreen> = {}): WorkspaceScreen {
  return {
    locked: false,
    setLocked: vi.fn(),
    canHide: true,
    hide: vi.fn(),
    hidden: [],
    show: vi.fn(),
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    openSaved: vi.fn(),
    reset: vi.fn(),
    ...changes,
  }
}

async function openMenu(place: WorkspacePanelLayout, workspace: WorkspaceScreen) {
  const user = userEvent.setup()
  render(
    <WorkspaceScreenContext.Provider value={workspace}>
      <WorkspacePanelContext.Provider value={place}>
        <h2 id="title">Rates and FX</h2>
        <PanelLayoutMenu code="FX" titleId="title" />
      </WorkspacePanelContext.Provider>
    </WorkspaceScreenContext.Provider>,
  )
  await user.click(screen.getByRole('button', { name: 'FX: layout menu' }))
  return user
}

const entry = (name: string) => screen.getByRole('menuitem', { name })

describe('PanelLayoutMenu', () => {
  it('in the grid, moves and sizes the panel and offers the steps of the screen', async () => {
    const workspace = screenOf({ hidden: [{ id: 'news', name: 'News' }], canUndo: true })
    const user = await openMenu(IN_GRID, workspace)
    expect(entry('Move left')).toBeDisabled()
    expect(entry('Move up')).toBeDisabled()
    expect(entry('Wider')).toBeEnabled()
    expect(entry('Undo')).toHaveAttribute('aria-keyshortcuts', 'Control+Z')
    expect(entry('Redo')).toBeDisabled()
    await user.click(entry('Show: News'))
    expect(workspace.show).toHaveBeenCalledWith('news')
  })

  it('once stacked, moves the panel up or down only', async () => {
    const move = vi.fn()
    const user = await openMenu(
      { id: 'rates', mode: 'stacked', index: 0, count: 3, move },
      screenOf(),
    )
    expect(screen.queryByRole('menuitem', { name: 'Move left' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Wider' })).not.toBeInTheDocument()
    expect(entry('Move up')).toBeDisabled()
    await user.click(entry('Move down'))
    expect(move).toHaveBeenCalledWith(1)
  })

  it('hides the panel', async () => {
    const workspace = screenOf()
    const user = await openMenu(IN_GRID, workspace)
    await user.click(entry('Hide the panel'))
    expect(workspace.hide).toHaveBeenCalledWith('rates')
  })

  it('does not hide the last panel shown', async () => {
    await openMenu(IN_GRID, screenOf({ canHide: false }))
    expect(entry('Hide the panel')).toBeDisabled()
  })

  it('locked, offers to unlock first and nothing that changes the layout', async () => {
    const workspace = screenOf({
      locked: true,
      canUndo: true,
      hidden: [{ id: 'news', name: 'News' }],
    })
    const user = await openMenu(IN_GRID, workspace)
    expect(screen.getByText('Layout locked')).toBeInTheDocument()
    expect(entry('Unlock the layout')).toHaveFocus()
    for (const name of ['Move right', 'Wider', 'Hide the panel', 'Show: News', 'Undo']) {
      expect(entry(name)).toBeDisabled()
    }
    expect(entry('Default layout of the screen')).toBeDisabled()
    expect(entry('Saved layouts…')).toBeEnabled()
    await user.click(entry('Unlock the layout'))
    expect(workspace.setLocked).toHaveBeenCalledWith(false)
  })
})
