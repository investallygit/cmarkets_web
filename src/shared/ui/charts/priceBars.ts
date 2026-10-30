import type { HistogramData, LineData, OhlcData } from 'lightweight-charts'
import type { HistoryPointDto, PriceBarDto } from '@/shared/api/contracts'
import { toChartTime } from './chartOptions'

export function toOhlcData(bars: readonly PriceBarDto[], intraday: boolean): OhlcData[] {
  return bars.map((bar) => ({
    time: toChartTime(bar.time, intraday),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }))
}

/** Closing prices, for the line chart. */
export function toCloseLine(bars: readonly PriceBarDto[], intraday: boolean): LineData[] {
  return bars.map((bar) => ({ time: toChartTime(bar.time, intraday), value: bar.close }))
}

export function toLineData(points: readonly HistoryPointDto[], intraday: boolean): LineData[] {
  return points.map((point) => ({ time: toChartTime(point.time, intraday), value: point.value }))
}

/** Volume bars coloured like their price bar: up when the close is at or above the open. */
export function toVolumeData(
  bars: readonly PriceBarDto[],
  intraday: boolean,
  upColor: string,
  downColor: string,
): HistogramData[] {
  return bars.map((bar) => ({
    time: toChartTime(bar.time, intraday),
    value: bar.volume,
    color: bar.close >= bar.open ? upColor : downColor,
  }))
}

/** A real-time price applied to the last bar: the close moves, the high and low widen. */
export function withLivePrice(bar: PriceBarDto, price: number): PriceBarDto {
  return {
    ...bar,
    high: Math.max(bar.high, price),
    low: Math.min(bar.low, price),
    close: price,
  }
}
