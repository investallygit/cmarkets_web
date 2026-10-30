import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { securityKeys } from '@/entities/security'
import { sessionKeys } from '@/entities/session'
import type { MeDto, OrderBookDto } from '@/shared/api/contracts'
import { OrderBookPanel } from './OrderBookPanel'

const analyst: MeDto = {
  id: 'user-analyst',
  displayName: 'K. Atangana',
  email: 'k.atangana@example.cm',
  accountType: 'analyst',
  organization: null,
  language: 'en',
  timeZone: 'Africa/Douala',
  phone: null,
  twoFactorChannel: 'email',
  permissions: ['market:read', 'market:orderbook'],
  quotas: { portfolios: 5, alerts: 50 },
  analystStatus: 'approved',
  modules: ['monitoring', 'analysis', 'portfolio'],
  trialEndsAt: null,
}

const book: OrderBookDto = {
  securityId: 'SEMC',
  bids: [
    { price: 52_400, quantity: 40 },
    { price: 52_300, quantity: 20 },
  ],
  asks: [
    { price: 52_500, quantity: 10 },
    { price: 52_600, quantity: 40 },
  ],
  timestamp: '2026-10-30T10:00:00Z',
}

function renderPanel(user: MeDto) {
  // Data already in the cache, never stale: the panel renders without a request.
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  queryClient.setQueryData(sessionKeys.me, user)
  queryClient.setQueryData(securityKeys.orderBook('SEMC'), book)
  return render(
    <QueryClientProvider client={queryClient}>
      <OrderBookPanel securityId="SEMC" securityType="equity" currency="XAF" />
    </QueryClientProvider>,
  )
}

describe('OrderBookPanel', () => {
  it('draws each quantity as a share of the largest one', () => {
    const { container } = renderPanel(analyst)
    expect(screen.getAllByRole('row')).toHaveLength(3)
    const widths = [...container.querySelectorAll<HTMLElement>('td > span[aria-hidden]')].map(
      (bar) => bar.style.width,
    )
    // Row by row: bid then ask.
    expect(widths).toEqual(['100%', '25%', '50%', '100%'])
  })

  it('is not part of a Student account (spec section 12)', () => {
    renderPanel({ ...analyst, accountType: 'student', permissions: ['market:read'] })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'The order book and the trades of the session are not part of a Student account.',
      ),
    ).toBeInTheDocument()
  })
})
