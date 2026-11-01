import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NamedLayoutDto } from '@/shared/api/contracts'
import { SavedLayoutsDialog } from './SavedLayoutsDialog'

const layout = (name: string): NamedLayoutDto => ({ name, items: [], hidden: [] })

function openDialog(saved: NamedLayoutDto[], { locked = false, unread = false } = {}) {
  const props = {
    onClose: vi.fn(),
    onSave: vi.fn(),
    onApply: vi.fn(),
    onDelete: vi.fn(),
  }
  render(<SavedLayoutsDialog open saved={saved} locked={locked} unread={unread} {...props} />)
  return { user: userEvent.setup(), ...props }
}

const nameField = () => screen.getByRole('textbox', { name: 'Save the current layout as' })

describe('SavedLayoutsDialog', () => {
  it('saves the current layout under a name, and says when it replaces one', async () => {
    const { user, onSave, onClose } = openDialog([layout('Morning')])
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Enter a name.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    await user.type(nameField(), ' morning ')
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument()
    await user.clear(nameField())
    await user.type(nameField(), 'Bonds')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('Bonds')
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps ten layouts at most, though one can still be replaced', async () => {
    const saved = Array.from({ length: 10 }, (_, index) => layout(`Layout ${index + 1}`))
    const { user, onSave } = openDialog(saved)
    await user.type(nameField(), 'Eleventh')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Up to 10 layouts per screen: delete one first.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
    await user.clear(nameField())
    await user.type(nameField(), 'Layout 3')
    await user.click(screen.getByRole('button', { name: 'Replace' }))
    expect(onSave).toHaveBeenCalledWith('Layout 3')
  })

  it('applies a saved layout, unless the layout is locked', async () => {
    const { user, onApply, onClose } = openDialog([layout('Morning')])
    await user.click(screen.getByRole('button', { name: 'Apply Morning' }))
    expect(onApply).toHaveBeenCalledWith('Morning')
    expect(onClose).toHaveBeenCalled()
  })

  it('locked, lists the saved layouts but applies none', () => {
    openDialog([layout('Morning')], { locked: true })
    expect(screen.getByRole('button', { name: 'Apply Morning' })).toBeDisabled()
    expect(screen.getByText('Unlock the layout to apply one.')).toBeInTheDocument()
  })

  it('unread, says the saved layouts could not be loaded and saves none', async () => {
    const { user, onSave } = openDialog([], { unread: true })
    expect(
      screen.getByText(/^The saved layouts of this screen could not be loaded/),
    ).toBeInTheDocument()
    await user.type(nameField(), 'Morning')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.keyboard('{Enter}')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('deletes a saved layout once confirmed', async () => {
    const { user, onDelete } = openDialog([layout('Morning')])
    await user.click(screen.getByRole('button', { name: 'Delete Morning' }))
    expect(screen.getByText('Delete the layout “Morning”?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('Morning')
  })
})
