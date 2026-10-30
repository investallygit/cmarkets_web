import { useLiveQuoteStore, type LiveIndex, type LiveQuote } from './store'

export function useLiveQuote(symbol: string): LiveQuote | undefined {
  return useLiveQuoteStore((state) => state.quotes[symbol])
}

export function useLiveIndex(code: string): LiveIndex | undefined {
  return useLiveQuoteStore((state) => state.indices[code])
}

export function useLastLiveUpdate(): string | null {
  return useLiveQuoteStore((state) => state.lastUpdate)
}
