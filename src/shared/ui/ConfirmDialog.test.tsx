import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function renderDialog(open = true) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  const view = render(
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Suspend account"
      confirmLabel="Suspend"
      tone="danger"
      requireReason
    />,
  )
  return { ...view, onClose, onConfirm }
}

describe('ConfirmDialog', () => {
  it('confirms only once a reason is given, and passes it on', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderDialog()
    const confirm = screen.getByRole('button', { name: 'Suspend' })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: 'Reason' }), '  Unpaid invoices  ')
    await user.click(confirm)
    expect(onConfirm).toHaveBeenCalledWith('Unpaid invoices')
  })

  it('focuses the reason when it opens', () => {
    renderDialog()
    expect(screen.getByRole('textbox', { name: 'Reason' })).toHaveFocus()
  })

  it('closes with Escape, the close button or Cancel', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()
    // jsdom does not turn Escape into the dialog's cancel event.
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('starts with an empty reason each time it opens', async () => {
    const user = userEvent.setup()
    const { rerender, onClose, onConfirm } = renderDialog()
    await user.type(screen.getByRole('textbox', { name: 'Reason' }), 'First')

    const props = { onClose, onConfirm, title: 'Suspend account', confirmLabel: 'Suspend' }
    rerender(<ConfirmDialog open={false} requireReason {...props} />)
    expect(screen.queryByRole('textbox', { name: 'Reason' })).not.toBeInTheDocument()
    rerender(<ConfirmDialog open requireReason {...props} />)
    expect(screen.getByRole('textbox', { name: 'Reason' })).toHaveValue('')
  })
})
