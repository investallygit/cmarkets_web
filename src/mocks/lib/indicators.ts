import type { HistoryPointDto } from '@/shared/api/contracts'

// Technical indicators that CMarket.Api computes on closing prices (spec section 3). The mock
// computes them the same way so the charts look right; the real figures come from the server.

const round = (value: number) => Math.round(value * 10_000) / 10_000

/** Simple moving average; the first period - 1 points have no value. */
export function sma(points: readonly HistoryPointDto[], period: number): HistoryPointDto[] {
  const result: HistoryPointDto[] = []
  let sum = 0
  points.forEach((point, index) => {
    sum += point.value
    if (index >= period) sum -= points[index - period].value
    if (index >= period - 1) result.push({ time: point.time, value: round(sum / period) })
  })
  return result
}

/** Exponential moving average seeded with the simple average of the first period values. */
function ema(values: readonly number[], period: number): (number | null)[] {
  const factor = 2 / (period + 1)
  const result: (number | null)[] = []
  let previous: number | null = null
  values.forEach((value, index) => {
    if (index < period - 1) {
      result.push(null)
      return
    }
    if (previous === null) {
      previous = values.slice(0, period).reduce((sum, item) => sum + item, 0) / period
    } else {
      previous = (value - previous) * factor + previous
    }
    result.push(previous)
  })
  return result
}

/** Bollinger bands: moving average plus and minus `width` population standard deviations. */
export function bollinger(points: readonly HistoryPointDto[], period = 20, width = 2) {
  const upper: HistoryPointDto[] = []
  const middle: HistoryPointDto[] = []
  const lower: HistoryPointDto[] = []
  for (let index = period - 1; index < points.length; index++) {
    const window = points.slice(index - period + 1, index + 1).map((point) => point.value)
    const mean = window.reduce((sum, value) => sum + value, 0) / period
    const deviation = Math.sqrt(
      window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period,
    )
    const time = points[index].time
    upper.push({ time, value: round(mean + width * deviation) })
    middle.push({ time, value: round(mean) })
    lower.push({ time, value: round(mean - width * deviation) })
  }
  return { upper, middle, lower }
}

/** Relative strength index with Wilder's smoothing, from 0 to 100. */
export function rsi(points: readonly HistoryPointDto[], period = 14): HistoryPointDto[] {
  const result: HistoryPointDto[] = []
  let gain = 0
  let loss = 0
  for (let index = 1; index < points.length; index++) {
    const change = points[index].value - points[index - 1].value
    const up = Math.max(change, 0)
    const down = Math.max(-change, 0)
    if (index <= period) {
      gain += up / period
      loss += down / period
      if (index < period) continue
    } else {
      gain = (gain * (period - 1) + up) / period
      loss = (loss * (period - 1) + down) / period
    }
    const value = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)
    result.push({ time: points[index].time, value: round(value) })
  }
  return result
}

/** MACD line (fast EMA - slow EMA), its signal EMA and the histogram between them. */
export function macd(points: readonly HistoryPointDto[], fast = 12, slow = 26, signal = 9) {
  const values = points.map((point) => point.value)
  const fastLine = ema(values, fast)
  const slowLine = ema(values, slow)
  const macdPoints: HistoryPointDto[] = []
  points.forEach((point, index) => {
    const a = fastLine[index]
    const b = slowLine[index]
    if (a !== null && b !== null) macdPoints.push({ time: point.time, value: a - b })
  })
  const signalLine = ema(
    macdPoints.map((point) => point.value),
    signal,
  )
  const result = {
    macd: [] as HistoryPointDto[],
    signal: [] as HistoryPointDto[],
    histogram: [] as HistoryPointDto[],
  }
  macdPoints.forEach((point, index) => {
    const value = signalLine[index]
    if (value === null) return
    result.macd.push({ time: point.time, value: round(point.value) })
    result.signal.push({ time: point.time, value: round(value) })
    result.histogram.push({ time: point.time, value: round(point.value - value) })
  })
  return result
}
