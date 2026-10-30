import type { HistoryPointDto, PriceBarDto } from '@/shared/api/contracts'

/** Linear congruential generator: the sample chart looks the same on every visit. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

/** Daily bars of a BVMAC-like equity (weekdays, 50 XAF steps), ending on the given session. */
export function sampleBars(lastSession: string, count = 250): PriceBarDto[] {
  const random = seededRandom(42)
  const sessions: string[] = []
  const day = new Date(`${lastSession}T00:00:00Z`)
  while (sessions.length < count) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) {
      sessions.unshift(day.toISOString().slice(0, 10))
    }
    day.setUTCDate(day.getUTCDate() - 1)
  }
  const step = (value: number) => Math.round(value / 50) * 50
  let close = 47_500
  return sessions.map((time) => {
    const open = close
    close = step(open * (1 + (random() - 0.48) * 0.03))
    return {
      time,
      open,
      high: Math.max(open, close) + step(random() * 200),
      low: Math.min(open, close) - step(random() * 200),
      close,
      volume: Math.round(20 + random() * 120),
    }
  })
}

/** Moving average of the closes. The screens get it from GET /indicators, not from this. */
export function movingAverage(bars: readonly PriceBarDto[], period: number): HistoryPointDto[] {
  const points: HistoryPointDto[] = []
  let sum = 0
  bars.forEach((bar, index) => {
    sum += bar.close
    if (index >= period) sum -= bars[index - period].close
    if (index >= period - 1) points.push({ time: bar.time, value: sum / period })
  })
  return points
}
