import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RfqRequestDto } from '@/shared/api/contracts'
import { rfqApi } from '@/shared/api/endpoints'
import { toast } from '@/shared/ui/toast'
import { CancelRfqButton, ConfirmSelectionButton } from './RequestActions'

// T. Bekale's request of the e2e flow, open, its selection one agreement.
const request = {
  id: 'rfq-1',
  number: 'RFQ-261118-0010',
  status: 'open',
  mine: true,
  allocation: {
    version: 4,
    lines: [],
    total: 300_000_000,
    agreements: 1,
    averagePrice: 100.15,
    averageRatePct: 5.2,
  },
  agreements: [],
} as unknown as RfqRequestDto
const confirmed = { ...request, status: 'confirmed', agreements: [{}] } as unknown as RfqRequestDto

/** The answer of the API, held until the test lets it come. */
function heldAnswer() {
  let answer: (value: RfqRequestDto) => void = () => {}
  const promise = new Promise<RfqRequestDto>((resolve) => (answer = resolve))
  return { promise, answer: () => answer(confirmed) }
}

/** The screen, and how the hub's event takes the request's buttons away (it is no longer open). */
function renderScreen(buttons: ReactNode) {
  const client = new QueryClient()
  const view = render(<QueryClientProvider client={client}>{buttons}</QueryClientProvider>)
  return {
    user: userEvent.setup(),
    readAgainByTheHub: () => view.rerender(<QueryClientProvider client={client} />),
  }
}

afterEach(() => vi.restoreAllMocks())

describe('the requester’s buttons (RFQ)', () => {
  it('says the selection is confirmed when the hub’s event took the button away first', async () => {
    const held = heldAnswer()
    vi.spyOn(rfqApi, 'confirm').mockReturnValue(held.promise)
    const success = vi.spyOn(toast, 'success')
    const { user, readAgainByTheHub } = renderScreen(<ConfirmSelectionButton request={request} />)

    await user.click(screen.getByRole('button', { name: 'Confirm selection (1 agreement)' }))
    readAgainByTheHub()
    held.answer()

    await vi.waitFor(() =>
      expect(success).toHaveBeenCalledWith(
        'RFQ-261118-0010 confirmed: its agreement awaits the SVTs.',
      ),
    )
  })

  it('says the request is cancelled when the hub’s event took the button away first', async () => {
    const held = heldAnswer()
    vi.spyOn(rfqApi, 'cancel').mockReturnValue(held.promise)
    const success = vi.spyOn(toast, 'success')
    const { user, readAgainByTheHub } = renderScreen(<CancelRfqButton request={request} />)

    await user.click(screen.getByRole('button', { name: 'Cancel request' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel request' }),
    )
    readAgainByTheHub()
    held.answer()

    await vi.waitFor(() => expect(success).toHaveBeenCalledWith('RFQ-261118-0010 cancelled.'))
  })
})
