import { render, screen } from '@testing-library/react'
import { useRef, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useKeyboardScrolling } from './useKeyboardScrolling'

function Box({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useKeyboardScrolling(ref)
  return (
    <div ref={ref} data-testid="box">
      {children}
    </div>
  )
}

/** A resize observer that reports the sizes as soon as it watches. */
class ReportingObserver {
  private readonly report: () => void
  constructor(report: () => void) {
    this.report = report
  }
  observe() {
    this.report()
  }
  disconnect() {}
}

describe('useKeyboardScrolling', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ReportingObserver)
    // Every box scrolls: its content is twice its height.
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('takes the focus when nothing in it does', () => {
    render(<Box>Some figures</Box>)
    expect(screen.getByTestId('box')).toHaveAttribute('tabindex', '0')
  })

  it('leaves the focus to a link in it', () => {
    render(
      <Box>
        <a href="/n">A news item</a>
      </Box>,
    )
    expect(screen.getByTestId('box')).not.toHaveAttribute('tabindex')
  })

  it('takes the focus when its links are out of the tab order, as the news tags of a list', () => {
    render(
      <Box>
        <a href="/n?type=flash" tabIndex={-1}>
          FLASH
        </a>
      </Box>,
    )
    expect(screen.getByTestId('box')).toHaveAttribute('tabindex', '0')
  })
})
