import { useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import type { MarketStatusDto } from '@/shared/api/contracts'
import { useRealtimeEvent } from '@/shared/realtime'
import { marketKeys } from './queries'

/**
 * While prices move, the session summary and the movers are asked again together this often at
 * most: the server keeps a quote 15 s (spec section 11), and MKT read them every minute and every
 * 30 s, behind the quotes and apart from each other (B06).
 */
export const LIVE_SUMMARY_MS = 15_000

/** Market status changes and data publications from the hub. Mounted once by the app shell. */
export function useMarketRealtimeSync() {
  const queryClient = useQueryClient()
  const lastRefresh = useRef(0)

  useRealtimeEvent('MarketStatusChanged', (change) => {
    queryClient.setQueryData<MarketStatusDto>(
      marketKeys.status(),
      (status) => status && { ...status, ...change },
    )
  })
  // A published import changes prices, indices and summaries: refresh the market screens.
  useRealtimeEvent('DataPublished', () => {
    void queryClient.invalidateQueries({ queryKey: marketKeys.all })
  })
  // Only the screens that show them ask: the others' queries are just marked stale.
  useRealtimeEvent('QuoteUpdated', () => {
    const now = Date.now()
    if (now - lastRefresh.current < LIVE_SUMMARY_MS) return
    lastRefresh.current = now
    void queryClient.invalidateQueries({ queryKey: marketKeys.summary() })
    void queryClient.invalidateQueries({ queryKey: [...marketKeys.all, 'movers'] })
  })
}
