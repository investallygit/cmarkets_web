import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useChartLabel } from './useChartLabel'

const BARS = [
  { close: 100, high: 101, low: 95 },
  { close: 104, high: 112, low: 99 },
  { close: 110, high: 111, low: 103 },
]

describe('useChartLabel', () => {
  it('says what the chart shows: the period, the move and the range', () => {
    const { result } = renderHook(() => useChartLabel('SEMC price', '6M', BARS, 0))
    expect(result.current).toBe('SEMC price, 6 months: from 100 to 110 (+10.00%), high 112, low 95')
  })

  it('takes the live price as the last one, as the chart does', () => {
    const { result } = renderHook(() => useChartLabel('SEMC price', '6M', BARS, 0, 120))
    expect(result.current).toBe('SEMC price, 6 months: from 100 to 120 (+20.00%), high 120, low 95')
  })

  it('names the chart alone while it has no data', () => {
    const { result } = renderHook(() => useChartLabel('BVMAC Equities', null, [], 2))
    expect(result.current).toBe('BVMAC Equities')
  })
})
