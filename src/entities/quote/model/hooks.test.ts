import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { IndexQuoteDto } from '@/shared/api/contracts'
import { useLiveIndexRows, useLiveQuoteRows } from './hooks'
import { useLiveQuoteStore, type LiveQuote } from './store'

interface Row {
  id: string
  last: number
}
const rows: Row[] = [
  { id: 'SEMC', last: 52500 },
  { id: 'BANGE', last: 26750 },
]
const symbolOf = (row: Row) => row.id
const merge = (row: Row, quote: LiveQuote): Row => ({ ...row, last: quote.last })
const ts = '2026-11-17T10:00:00Z'

afterEach(() => useLiveQuoteStore.setState({ quotes: {}, indices: {}, lastUpdate: null }))

describe('useLiveQuoteRows (B42)', () => {
  it("merges each row's live quote, a new array on a tick of its own securities only", () => {
    const { result } = renderHook(() => useLiveQuoteRows(rows, symbolOf, merge))
    const first = result.current
    expect(first).toEqual(rows)
    act(() =>
      useLiveQuoteStore
        .getState()
        .applyQuote({ symbol: 'OTHER', last: 1, change: 0, changePct: 0, volume: 0, ts }),
    )
    expect(result.current).toBe(first)
    act(() =>
      useLiveQuoteStore
        .getState()
        .applyQuote({ symbol: 'BANGE', last: 27500, change: 750, changePct: 2.8, volume: 10, ts }),
    )
    expect(result.current).toEqual([
      { id: 'SEMC', last: 52500 },
      { id: 'BANGE', last: 27500 },
    ])
  })
})

describe('useLiveIndexRows (B42)', () => {
  it('gives each index its live value, change and % change', () => {
    const index: IndexQuoteDto = {
      code: 'BVMAC',
      name: 'BVMAC Equities',
      value: 1000,
      previousClose: 990,
      change: 10,
      changePct: 1.01,
      timestamp: ts,
    }
    const { result } = renderHook(() => useLiveIndexRows([index]))
    act(() =>
      useLiveQuoteStore.getState().applyIndex({ code: 'BVMAC', value: 980, changePct: -1.01, ts }),
    )
    expect(result.current[0]).toMatchObject({ value: 980, change: -10, changePct: -1.01 })
  })
})
