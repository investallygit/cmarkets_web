import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { useLiveQuoteStore } from '../model/store'
import { quoteKeys } from './queries'

/**
 * Feeds real-time quotes and index values into the live store; a published file or a correction
 * (DataPublished) refreshes the snapshots. Mounted once by the app shell.
 */
export function useQuoteRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('QuoteUpdated', (quote) => useLiveQuoteStore.getState().applyQuote(quote))
  useRealtimeEvent('IndexUpdated', (index) => useLiveQuoteStore.getState().applyIndex(index))
  useRealtimeEvent('DataPublished', () => {
    void queryClient.invalidateQueries({ queryKey: quoteKeys.all })
  })
}
