import { describe, expect, it } from 'vitest'
import type { HistoryPointDto } from '@/shared/api/contracts'
import { bollinger, macd, rsi, sma } from './indicators'

const series = (values: number[]): HistoryPointDto[] =>
  values.map((value, index) => ({ time: `2026-10-${String(index + 1).padStart(2, '0')}`, value }))

describe('mock indicators', () => {
  it('averages the last values', () => {
    expect(sma(series([1, 2, 3, 4, 5]), 3).map((point) => point.value)).toEqual([2, 3, 4])
    expect(sma(series([1, 2, 3, 4, 5]), 3)[0].time).toBe('2026-10-03')
  })

  it('keeps the RSI between 0 and 100', () => {
    const rising = rsi(series(Array.from({ length: 30 }, (_, index) => 100 + index)), 14)
    expect(rising).toHaveLength(16)
    expect(rising.every((point) => point.value === 100)).toBe(true)

    const mixed = rsi(series([44, 44.3, 44.1, 43.6, 44.3, 44.8, 45.1, 45.4, 45.8, 46.1, 45.9]), 5)
    expect(mixed.every((point) => point.value > 0 && point.value < 100)).toBe(true)
  })

  it('closes the Bollinger bands on a flat price', () => {
    const { upper, middle, lower } = bollinger(series(Array(25).fill(50)), 20)
    expect(upper).toHaveLength(6)
    expect(upper[0].value).toBe(50)
    expect(middle[0].value).toBe(50)
    expect(lower[0].value).toBe(50)
  })

  it('draws a flat MACD on a flat price, from the slow average plus the signal period', () => {
    const lines = macd(series(Array(40).fill(100)))
    expect(lines.macd).toHaveLength(40 - 26 + 1 - 8)
    expect(lines.histogram.every((point) => point.value === 0)).toBe(true)
  })
})
