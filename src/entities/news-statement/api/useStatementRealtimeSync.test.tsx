import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { RealtimeProvider, type ChatClient, type RealtimeClient } from '@/shared/realtime'
import { providerStatementKeys } from './queries'
import { useStatementRealtimeSync } from './useStatementRealtimeSync'

describe('useStatementRealtimeSync (B97)', () => {
  it("reads the newspaper's statements again with each notice it gets", () => {
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
    renderHook(() => useStatementRealtimeSync(), { wrapper })
    handlers.get('AlertTriggered')?.({
      alertId: 'n-1',
      message: 'Your dispute of MPAY-2026-10-MEDIAI is answered: the amount stands, XAF 368,400.',
      ts: '2026-11-17T10:00:00Z',
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: providerStatementKeys.all })
  })
})
