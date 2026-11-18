import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { IndexQuoteDto } from '@/shared/api/contracts'
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

const NO_ROWS: never[] = []

/**
 * The rows of a table with their live quote merged in by `merge`, as their live cells show them:
 * the table then sorts on what it shows, not on the values first loaded (B42). A new array when
 * one of their quotes ticks, the same one otherwise. `symbolOf` and `merge` are stable functions.
 */
export function useLiveQuoteRows<TRow>(
  rows: readonly TRow[] | undefined,
  symbolOf: (row: TRow) => string,
  merge: (row: TRow, quote: LiveQuote) => TRow,
): TRow[] {
  const list = rows ?? NO_ROWS
  const quotes = useLiveQuoteStore(
    useShallow((state) => list.map((row) => state.quotes[symbolOf(row)])),
  )
  return useMemo(
    () => list.map((row, index) => (quotes[index] ? merge(row, quotes[index]) : row)),
    [list, quotes, merge],
  )
}

/** The indices with their live value, change and % change, as `LiveIndex*` show them (B42). */
export function useLiveIndexRows(indices: readonly IndexQuoteDto[] | undefined): IndexQuoteDto[] {
  const list = indices ?? NO_ROWS
  const ticks = useLiveQuoteStore(
    useShallow((state) => list.map((index) => state.indices[index.code])),
  )
  return useMemo(
    () =>
      list.map((index, position) => {
        const tick = ticks[position]
        return tick
          ? {
              ...index,
              value: tick.value,
              change: tick.value - index.previousClose,
              changePct: tick.changePct,
            }
          : index
      }),
    [list, ticks],
  )
}
