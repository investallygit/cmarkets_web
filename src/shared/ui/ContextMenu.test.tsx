import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCallback, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu } from './ContextMenu'
import type { MenuItem } from './menu'

const onSelect = vi.fn()
const ITEMS: MenuItem[] = [
  { id: 'title', kind: 'label', label: 'Portfolio' },
  { id: 'edit', label: 'Edit', onSelect },
  { id: 'copy', label: 'Copy', disabled: true },
  { id: 'separator', label: '', kind: 'separator' },
  { id: 'delete', label: 'Delete', onSelect },
]

/** A button that opens the menu, as the user badge does. */
function MenuButton() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Actions
      </button>
      <button type="button">Next</button>
      {open && <ContextMenu x={0} y={0} items={ITEMS} onClose={close} />}
    </>
  )
}

describe('ContextMenu', () => {
  it('takes the focus, and goes through the entries with the arrows', async () => {
    const user = userEvent.setup()
    render(<MenuButton />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
    // The disabled entry is passed over; the ends wrap round.
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
    await user.keyboard('{End}{Home}{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus()
  })

  it('gives the focus back on Escape, and moves on from its button on Tab', async () => {
    const user = userEvent.setup()
    render(<MenuButton />)
    const actions = screen.getByRole('button', { name: 'Actions' })
    await user.click(actions)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(actions).toHaveFocus()

    await user.click(actions)
    await user.tab()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
  })
})
