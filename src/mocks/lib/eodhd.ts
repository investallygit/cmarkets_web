import type { EodhdJob, EodhdRunDto, EodhdStatusDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import { createRandom, hashString } from './random'
import { atUtc, isWeekday, MINUTE_MS } from './time'

interface JobPlan {
  job: EodhdJob
  /** Start in Douala time (UTC+1). */
  hour: number
  minute: number
  weekdaysOnly: boolean
  symbols: number
  /** A bulk call counts 100 against the quota. */
  calls: number
  seconds: number
}

/**
 * The scheduled jobs of spec section 11: the closing prices of each exchange after its close
 * through the bulk endpoint, the fundamentals at night (times of the screen 6 mockup).
 */
// prettier-ignore
const JOBS: readonly JobPlan[] = [
  { job: 'europe-eod', hour: 18, minute: 6, weekdaysOnly: true, symbols: 9_850, calls: 900, seconds: 74 },
  { job: 'us-eod', hour: 22, minute: 14, weekdaysOnly: true, symbols: 11_420, calls: 300, seconds: 96 },
  { job: 'fundamentals', hour: 3, minute: 0, weekdaysOnly: false, symbols: 1_240, calls: 12_400, seconds: 1_820 },
]

/** Calls of the commercial licence per day; quotes and history between loads count too. */
export const EODHD_DAILY_QUOTA = 115_000
const ON_DEMAND_CALLS_PER_HOUR = 4_200
const HISTORY_DAYS = 7
const RATE_LIMITED = '429 Too Many Requests: retried after the Retry-After delay (60 s).'

/** The runs of the last days, newest first: a 429 now and then, retried 15 minutes later. */
export function eodhdRuns(now: number): EodhdRunDto[] {
  const today = toMarketDay(now)
  const runs: EodhdRunDto[] = []
  for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
    const day = addDays(today, -offset)
    for (const plan of JOBS) {
      if (plan.weekdaysOnly && !isWeekday(day)) continue
      const start = Date.parse(atUtc(day, plan.hour - 1, plan.minute))
      if (start > now) continue
      const random = createRandom(hashString(`eodhd|${plan.job}|${day}`))
      const failed = random() < 0.08
      const run = (at: number, ok: boolean): EodhdRunDto => ({
        id: `eodhd-${plan.job}-${day}-${ok ? 'ok' : 'failed'}`,
        job: plan.job,
        startedAt: new Date(at).toISOString(),
        durationSeconds: Math.round(plan.seconds * (ok ? 0.85 + random() * 0.3 : 0.1)),
        status: ok ? 'ok' : 'failed',
        symbols: ok ? Math.round(plan.symbols * (0.99 + random() * 0.02)) : 0,
        calls: ok ? plan.calls : 100,
        error: ok ? null : RATE_LIMITED,
      })
      if (!failed) {
        runs.push(run(start, true))
        continue
      }
      runs.push(run(start, false))
      const retry = start + 15 * MINUTE_MS
      if (retry <= now) runs.push(run(retry, true))
    }
  }
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

/** GET /data/providers/eodhd/status */
export function eodhdStatus(now = Date.now()): EodhdStatusDto {
  const runs = eodhdRuns(now)
  const today = toMarketDay(now)
  // Midnight in Douala (UTC+1).
  const dayStart = Date.parse(`${today}T00:00:00+01:00`)
  const hours = (now - dayStart) / 3_600_000
  const jitter = createRandom(hashString(`eodhd|calls|${today}`))()
  const loadCalls = runs
    .filter((run) => toMarketDay(run.startedAt) === today)
    .reduce((sum, run) => sum + run.calls, 0)
  const callsToday =
    Math.round(hours * ON_DEMAND_CALLS_PER_HOUR * (0.95 + jitter * 0.1)) + loadCalls
  const dayAgo = new Date(now - 24 * 3_600_000).toISOString()
  const recentFailures = runs.filter((run) => run.status === 'failed' && run.startedAt >= dayAgo)
  // A failed load stays a problem until the same job runs again.
  const unresolved = recentFailures.some(
    (failure) =>
      !runs.some(
        (run) =>
          run.job === failure.job && run.status === 'ok' && run.startedAt > failure.startedAt,
      ),
  )
  const lastFailure = recentFailures[0]
  return {
    status: unresolved ? 'degraded' : 'operational',
    latest: JOBS.flatMap((plan) => runs.find((run) => run.job === plan.job) ?? []),
    runs,
    callsToday,
    dailyQuota: EODHD_DAILY_QUOTA,
    rateLimited24h: recentFailures.length,
    lastError: lastFailure ? { at: lastFailure.startedAt, message: lastFailure.error ?? '' } : null,
    checkedAt: new Date(now).toISOString(),
  }
}
