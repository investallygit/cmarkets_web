import { describe, expect, it } from 'vitest'
import { EODHD_DAILY_QUOTA, eodhdRuns, eodhdStatus } from './eodhd'

// Friday 30 October 2026, 19:00 in Douala: Europe has closed, the US not yet.
const NOW = Date.parse('2026-10-30T18:00:00Z')

describe('EODHD connector', () => {
  it('runs the bulk loads after each close and the fundamentals at night', () => {
    const runs = eodhdRuns(NOW)
    expect(
      runs.every((run, index) => index === 0 || run.startedAt <= runs[index - 1].startedAt),
    ).toBe(true)
    // Europe at 18:06 Douala today; the US load waits for 22:14.
    expect(runs.find((run) => run.job === 'europe-eod')?.startedAt.slice(0, 10)).toBe('2026-10-30')
    expect(runs.find((run) => run.job === 'us-eod')?.startedAt.slice(0, 10)).toBe('2026-10-29')
    // No closing prices at the weekend.
    expect(
      runs.some((run) => run.job !== 'fundamentals' && run.startedAt.startsWith('2026-10-25')),
    ).toBe(false)
  })

  it('retries a 429 fifteen minutes later', () => {
    const runs = eodhdRuns(NOW)
    for (const failure of runs.filter((run) => run.status === 'failed')) {
      const retry = new Date(Date.parse(failure.startedAt) + 15 * 60_000).toISOString()
      if (retry > new Date(NOW).toISOString()) continue
      expect(runs).toContainEqual(
        expect.objectContaining({ job: failure.job, status: 'ok', startedAt: retry }),
      )
    }
  })

  it('counts the calls of the day against the quota', () => {
    const status = eodhdStatus(NOW)
    expect(status.dailyQuota).toBe(EODHD_DAILY_QUOTA)
    expect(status.callsToday).toBeGreaterThan(0)
    expect(status.callsToday).toBeLessThan(EODHD_DAILY_QUOTA)
    expect(status.latest.map((run) => run.job).sort()).toEqual([
      'europe-eod',
      'fundamentals',
      'us-eod',
    ])
  })
})
