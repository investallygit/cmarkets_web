import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { Dialog } from './Dialog'

/** A dialog kept on the page, opened and closed by its state, until its panel goes. */
function Rename({ panel = true }: { panel?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Rename
      </button>
      {panel && (
        <Dialog open={open} onClose={() => setOpen(false)} title="Rename the specialty">
          <input aria-label="Name" />
        </Dialog>
      )}
    </>
  )
}

/** A dialog shown while some state holds, as "Leave the group" in MSG. */
function LeaveGroup({ onLeave = () => {} }: { onLeave?: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [left, setLeft] = useState(false)
  if (left) return <p>You left the group.</p>
  return (
    <>
      <button type="button" onClick={() => setLeaving(true)}>
        Leave the group
      </button>
      {leaving && (
        <ConfirmDialog
          open
          title="Leave CEMAC rates desk"
          confirmLabel="Leave"
          onConfirm={() => {
            onLeave()
            setLeft(true)
          }}
          onClose={() => setLeaving(false)}
        />
      )}
    </>
  )
}

describe('Dialog', () => {
  it('gives the focus back to its opener when it is taken off the page', async () => {
    const user = userEvent.setup()
    render(<LeaveGroup />)
    const opener = screen.getByRole('button', { name: 'Leave the group' })
    await user.click(opener)
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)

    // Escape: jsdom does not turn it into the dialog's cancel event.
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('leaves the focus alone once the action took the opener away', async () => {
    const user = userEvent.setup()
    render(<LeaveGroup />)
    await user.click(screen.getByRole('button', { name: 'Leave the group' }))
    await user.click(screen.getByRole('button', { name: 'Leave' }))
    expect(screen.getByText('You left the group.')).toBeInTheDocument()
    expect(document.body).toHaveFocus()
  })

  it('leaves the focus alone when it leaves the page closed', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Rename />)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // The focus is on the page (jsdom gives none back on close), as after a click outside the
    // controls. The dialog's panel then goes: the opener does not take the focus back.
    expect(document.body).toHaveFocus()
    rerender(<Rename panel={false} />)
    expect(document.body).toHaveFocus()
  })
})
