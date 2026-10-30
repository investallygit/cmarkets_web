import { useRealtimeEvent } from '@/shared/realtime'
import { useLiveQuoteStore } from '../model/store'

/** Feeds real-time quotes and index values into the live store. Mounted once by the app shell. */
export function useQuoteRealtimeSync() {
  useRealtimeEvent('QuoteUpdated', (quote) => useLiveQuoteStore.getState().applyQuote(quote))
  useRealtimeEvent('IndexUpdated', (index) => useLiveQuoteStore.getState().applyIndex(index))
}
