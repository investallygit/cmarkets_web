import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RealtimeProvider, type ChatClient, type RealtimeClient } from '@/shared/realtime'
import { marketKeys } from './queries'
import { LIVE_SUMMARY_MS, useMarketRealtimeSync } from './useMarketRealtimeSync'

afterEach(() => vi.useRealTimers())

describe('useMarketRealtimeSync (B06)', () => {
  it('asks the summary and the movers again together while prices move, every 15 s at most', () => {
    vi.useFakeTimers({ now: Date.parse('2026-11-17T10:00:00Z') })
    const handlers = new Map<string, (payload: unknown) => void>()
    const market = {
      state: 'connected',
      on: (event: string, handler: (payload: unknown) => void) => {
        handlers.set(event, handler)
        return () => handlers.delete(event)
      },
      onStateChange: () => () => undefined,
    } as unknown as RealtimeClient
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider client={market} chat={{} as ChatClient}>
          {children}
        </RealtimeProvider>
      </QueryClientProvider>
    )
    renderHook(() => useMarketRealtimeSync(), { wrapper })
    const tick = () =>
      handlers.get('QuoteUpdated')?.({
        symbol: 'SEMC',
        last: 52600,
        change: 100,
        changePct: 0.19,
        volume: 10,
        ts: new Date().toISOString(),
      })

    tick()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: marketKeys.summary() })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [...marketKeys.all, 'movers'] })
    expect(invalidate).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1_200)
    tick()
    expect(invalidate).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(LIVE_SUMMARY_MS)
    tick()
    expect(invalidate).toHaveBeenCalledTimes(4)
  })
})
