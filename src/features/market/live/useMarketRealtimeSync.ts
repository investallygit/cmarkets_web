import { useQueryClient } from '@tanstack/react-query'
import type { MarketStatusDto } from '@/shared/api/contracts'
import { useRealtimeEvent } from '@/shared/realtime'
import { marketKeys } from '../api'
import { useLiveMarketStore } from './store'

/** Feeds the real-time hub into the market state. Mounted once by the app shell. */
export function useMarketRealtimeSync() {
  const queryClient = useQueryClient()

  useRealtimeEvent('QuoteUpdated', (quote) => useLiveMarketStore.getState().applyQuote(quote))
  useRealtimeEvent('IndexUpdated', (index) => useLiveMarketStore.getState().applyIndex(index))
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
}
