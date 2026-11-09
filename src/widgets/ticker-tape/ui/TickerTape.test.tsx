import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { marketKeys } from '@/entities/market'
import type { TickerItemDto } from '@/shared/api/contracts'
import { RealtimeProvider, type ChatClient, type RealtimeClient } from '@/shared/realtime'
import { TickerTape } from './TickerTape'

const ticker: TickerItemDto[] = [
  {
    kind: 'index',
    symbol: 'BVMAC-A',
    label: 'BVMAC-A',
    type: 'index',
    currency: 'XAF',
    last: 1_280.85,
    changePct: 0.01,
  },
  {
    kind: 'security',
    symbol: 'SEMC',
    label: 'SEMC',
    type: 'equity',
    currency: 'XAF',
    last: 52_090,
    changePct: 0.1,
  },
]

describe('TickerTape', () => {
  it('follows its indices as well as its securities on the hub', () => {
    const subscribe = vi.fn(() => Promise.resolve())
    const market = {
      state: 'connected',
      subscribe,
      unsubscribe: () => Promise.resolve(),
      on: () => () => undefined,
      onStateChange: () => () => undefined,
    } as unknown as RealtimeClient
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    queryClient.setQueryData(marketKeys.ticker(), ticker)

    render(
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider client={market} chat={{} as ChatClient}>
          <TickerTape />
        </RealtimeProvider>
      </QueryClientProvider>,
    )

    expect(screen.getByText('BVMAC-A')).toBeInTheDocument()
    expect(subscribe).toHaveBeenCalledWith(['BVMAC-A', 'SEMC'])
  })
})
