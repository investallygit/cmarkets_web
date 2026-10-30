import { describe, expect, it } from 'vitest'
import { priceHistory, type BarSecurity } from './bars'

const semc: BarSecurity = {
  id: 'SEMC',
  type: 'equity',
  previousClose: 51_900,
  open: 51_900,
  high: 52_800,
  low: 51_900,
  last: 52_500,
  volume: 96,
  typicalVolume: 100,
}
// Friday 30/10/2026, two hours into the session (09:00 to 14:00 Douala, 08:00 to 13:00 UTC).
const now = Date.parse('2026-10-30T10:00:00Z')

describe('mock price history', () => {
  it("ends with today's session at the live prices, after the previous close", () => {
    const bars = priceHistory(semc, '2026-10-01', '2026-10-30', '1d', now)
    expect(bars.at(-1)).toMatchObject({ open: 51_900, high: 52_800, low: 51_900, close: 52_500 })
    expect(bars.at(-2)?.close).toBe(51_900)
    expect(bars.every((bar) => bar.close % 5 === 0 && bar.low <= bar.high)).toBe(true)
  })

  it('gives every period the same past sessions, so drawings stay in place', () => {
    const month = priceHistory(semc, '2026-10-01', '2026-10-30', '1d', now)
    const year = priceHistory(semc, '2025-10-30', '2026-10-30', '1d', now)
    expect(year.slice(-month.length)).toEqual(month)
  })

  it('groups weeks from Monday and cuts today in 5-minute bars up to now', () => {
    const weeks = priceHistory(semc, '2026-10-01', '2026-10-30', '1w', now)
    expect(weeks.at(-1)).toMatchObject({ time: '2026-10-26T08:00:00.000Z', close: 52_500 })

    const today = priceHistory(semc, '2026-10-29', '2026-10-30', '5m', now)
    expect(today).toHaveLength(25)
    expect(today[0]).toMatchObject({ time: '2026-10-30T08:00:00.000Z', open: 51_900 })
    expect(today.at(-1)?.close).toBe(52_500)
  })
})
