import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('submits once on a double click, before the request turns it busy (B76)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Create the draft</Button>
      </form>,
    )
    await user.dblClick(screen.getByRole('button', { name: 'Create the draft' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it("acts once on a double click when it shows a request's progress (B76)", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button busy={false} onClick={onClick}>
        Resend
      </Button>,
    )
    await user.dblClick(screen.getByRole('button', { name: 'Resend' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('takes every click of any other button, and the keyboard each time', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Next</Button>)
    await user.dblClick(screen.getByRole('button', { name: 'Next' }))
    expect(onClick).toHaveBeenCalledTimes(2)
    screen.getByRole('button', { name: 'Next' }).focus()
    await user.keyboard('{Enter}{Enter}')
    expect(onClick).toHaveBeenCalledTimes(4)
  })
})
