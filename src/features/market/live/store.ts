import { create } from 'zustand'
import type { RealtimeEventMap } from '@/shared/realtime'

export type LiveQuote = RealtimeEventMap['QuoteUpdated']
export type LiveIndex = RealtimeEventMap['IndexUpdated']

interface LiveMarketState {
  quotes: Partial<Record<string, LiveQuote>>
  indices: Partial<Record<string, LiveIndex>>
  /** Timestamp of the latest real-time message, shown in the status bar. */
  lastUpdate: string | null
  applyQuote: (quote: LiveQuote) => void
  applyIndex: (index: LiveIndex) => void
}

/**
 * Latest real-time values, kept apart from the REST cache: each table cell subscribes to its own
 * symbol, so a tick re-renders one cell instead of the whole table.
 */
export const useLiveMarketStore = create<LiveMarketState>()((set) => ({
  quotes: {},
  indices: {},
  lastUpdate: null,
  applyQuote: (quote) =>
    set((state) => ({ quotes: { ...state.quotes, [quote.symbol]: quote }, lastUpdate: quote.ts })),
  applyIndex: (index) =>
    set((state) => ({ indices: { ...state.indices, [index.code]: index }, lastUpdate: index.ts })),
}))
