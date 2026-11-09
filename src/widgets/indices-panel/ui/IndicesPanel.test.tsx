import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { marketKeys } from '@/entities/market'
import type { MarketSummaryDto } from '@/shared/api/contracts'
import { RealtimeProvider, type ChatClient, type RealtimeClient } from '@/shared/realtime'
import { IndicesPanel } from './IndicesPanel'

const index = (code: string, name: string) => ({
  code,
  name,
  value: 1_280,
  previousClose: 1_279,
  change: 1,
  changePct: 0.08,
  timestamp: '2026-10-30T10:00:00Z',
})

const summary: MarketSummaryDto = {
  indices: [index('BVMAC-A', 'BVMAC Equities'), index('CMK-BANK', 'CMarket Banks')],
  advancers: 4,
  decliners: 4,
  unchanged: 1,
  valueTraded: 6_000_000_000,
  currency: 'XAF',
  asOf: '2026-10-30T10:00:00Z',
}

describe('IndicesPanel', () => {
  it('follows its indices on the hub, which sends IndexUpdated only to their followers', () => {
    const subscribe = vi.fn(() => Promise.resolve())
    const unsubscribe = vi.fn(() => Promise.resolve())
    const market = {
      state: 'connected',
      subscribe,
      unsubscribe,
      on: () => () => undefined,
      onStateChange: () => () => undefined,
    } as unknown as RealtimeClient
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
    queryClient.setQueryData(marketKeys.summary(), summary)

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider client={market} chat={{} as ChatClient}>
          <IndicesPanel />
        </RealtimeProvider>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('row', { name: /BVMAC Equities/ })).toBeInTheDocument()
    expect(subscribe).toHaveBeenCalledWith(['BVMAC-A', 'CMK-BANK'])
    unmount()
    expect(unsubscribe).toHaveBeenCalledWith(['BVMAC-A', 'CMK-BANK'])
  })
})
