import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

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
})
