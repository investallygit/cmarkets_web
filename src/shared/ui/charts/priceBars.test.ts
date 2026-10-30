import { describe, expect, it } from 'vitest'
import type { PriceBarDto } from '@/shared/api/contracts'
import { formatChartTime, toChartTime } from './chartOptions'
import { toOhlcData, toVolumeData, withLivePrice } from './priceBars'

const bar: PriceBarDto = {
  time: '2026-10-28',
  open: 51900,
  high: 52800,
  low: 51900,
  close: 52500,
  volume: 96,
}

describe('price bars', () => {
  it('places daily bars on their market day', () => {
    expect(toOhlcData([bar], false)).toEqual([
      { time: '2026-10-28', open: 51900, high: 52800, low: 51900, close: 52500 },
    ])
  })

  it('colours volume like the price bar', () => {
    const down = { ...bar, time: '2026-10-29', close: 51000 }
    expect(toVolumeData([bar, down], false, 'green', 'red').map((point) => point.color)).toEqual([
      'green',
      'red',
    ])
  })

  it('moves the close of the last bar and widens its range with real-time prices', () => {
    expect(withLivePrice(bar, 53000)).toMatchObject({ high: 53000, low: 51900, close: 53000 })
    expect(withLivePrice(bar, 51500)).toMatchObject({ high: 52800, low: 51500, close: 51500 })
  })
})

describe('formatChartTime', () => {
  it('shows days as DD/MM/YYYY and intraday times in Douala time', () => {
    expect(formatChartTime('2026-10-28')).toBe('28/10/2026')
    expect(formatChartTime(toChartTime('2026-10-28T09:42:00Z', true))).toBe('28/10/2026 10:42')
  })
})
