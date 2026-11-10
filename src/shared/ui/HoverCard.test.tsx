import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HoverCard } from './HoverCard'

function Tag() {
  return (
    <HoverCard content="Media I · Partner newspaper">
      {(describedBy) => (
        <a href="/n?source=media-i" aria-describedby={describedBy}>
          MEDIA I
        </a>
      )}
    </HoverCard>
  )
}

describe('HoverCard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows on hover, stays while the pointer moves onto it, and Escape closes it', () => {
    render(<Tag />)
    const tag = screen.getByRole('link', { name: 'MEDIA I' })

    fireEvent.mouseEnter(tag)
    const card = screen.getByRole('tooltip')
    expect(card).toHaveTextContent('Media I · Partner newspaper')
    // From the tag onto the card: it stays.
    fireEvent.mouseLeave(tag)
    fireEvent.mouseEnter(card)
    act(() => vi.advanceTimersByTime(500))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows on focus as the description of its trigger, and goes with the focus', () => {
    render(<Tag />)
    const tag = screen.getByRole('link', { name: 'MEDIA I' })

    fireEvent.focus(tag)
    expect(tag).toHaveAccessibleDescription('Media I · Partner newspaper')
    // A scroll, as the focus brings the tag into view, does not close it.
    fireEvent.scroll(window)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(tag)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(tag).not.toHaveAttribute('aria-describedby')
  })

  it('closes a moment after the pointer leaves', () => {
    render(<Tag />)
    const tag = screen.getByRole('link', { name: 'MEDIA I' })

    fireEvent.mouseEnter(tag)
    fireEvent.mouseLeave(tag)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
