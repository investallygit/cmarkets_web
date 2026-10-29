import { useLiveMarketStore, type LiveIndex, type LiveQuote } from './store'

export function useLiveQuote(symbol: string): LiveQuote | undefined {
  return useLiveMarketStore((state) => state.quotes[symbol])
}

export function useLiveIndex(code: string): LiveIndex | undefined {
  return useLiveMarketStore((state) => state.indices[code])
}

export function useLastLiveUpdate(): string | null {
  return useLiveMarketStore((state) => state.lastUpdate)
}
