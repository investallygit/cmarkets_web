import { useShallow } from 'zustand/react/shallow'
import { useLiveQuoteStore, type LiveIndex, type LiveQuote } from './store'

export function useLiveQuote(symbol: string): LiveQuote | undefined {
  return useLiveQuoteStore((state) => state.quotes[symbol])
}

/** Last prices of several securities, undefined until a quote arrives; a new array on each tick. */
export function useLivePrices(symbols: readonly string[]): (number | undefined)[] {
  return useLiveQuoteStore(
    useShallow((state) => symbols.map((symbol) => state.quotes[symbol]?.last)),
  )
}

export function useLiveIndex(code: string): LiveIndex | undefined {
  return useLiveQuoteStore((state) => state.indices[code])
}

export function useLastLiveUpdate(): string | null {
  return useLiveQuoteStore((state) => state.lastUpdate)
}
