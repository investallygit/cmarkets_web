import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pager } from './Pager'

describe('Pager', () => {
  it('shows the rows of the page and moves to the next one', async () => {
    const onChange = vi.fn()
    render(<Pager page={1} pageSize={20} totalCount={128} onChange={onChange} />)
    expect(screen.getByText('1–20 of 128')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('ends at the last rows and hides itself for a single page', () => {
    const { rerender } = render(
      <Pager page={7} pageSize={20} totalCount={128} onChange={vi.fn()} />,
    )
    expect(screen.getByText('121–128 of 128')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    rerender(<Pager page={1} pageSize={20} totalCount={12} onChange={vi.fn()} />)
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
