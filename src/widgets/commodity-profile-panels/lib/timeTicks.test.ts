import { describe, expect, it } from 'vitest'
import { timeTicks } from './timeTicks'

/** One date a week from `from` for `weeks` weeks. */
function weekly(from: string, weeks: number): string[] {
  const start = Date.parse(`${from}T00:00:00Z`)
  return Array.from({ length: weeks }, (_, week) =>
    new Date(start + week * 7 * 86_400_000).toISOString().slice(0, 10),
  )
}

describe('timeTicks (B10)', () => {
  it('ticks each year once over five years', () => {
    const { ticks, byMonth } = timeTicks(weekly('2021-11-19', 52 * 5))
    expect(byMonth).toBe(false)
    expect(ticks.map((date) => date.slice(0, 4))).toEqual([
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
    ])
  })

  it('ticks each quarter over a year, by month', () => {
    const { ticks, byMonth } = timeTicks(weekly('2025-11-21', 52))
    expect(byMonth).toBe(true)
    expect(ticks.map((date) => date.slice(0, 7))).toEqual([
      '2025-11',
      '2026-01',
      '2026-04',
      '2026-07',
      '2026-10',
    ])
  })

  it('keeps at most ten ticks over a long history', () => {
    const { ticks } = timeTicks(weekly('1987-05-22', 52 * 39))
    expect(ticks.length).toBeLessThanOrEqual(10)
    expect(new Set(ticks.map((date) => date.slice(0, 4))).size).toBe(ticks.length)
  })
})
