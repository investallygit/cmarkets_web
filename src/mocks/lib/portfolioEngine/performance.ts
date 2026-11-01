import type { PerformanceDto, PerformancePeriod, PeriodReturnDto } from '@/shared/api/contracts'
import { addDays, addMonths } from '@/shared/lib/isoDate'
import { annualize, chainReturns, moneyWeightedReturn, valueIndex } from '../portfolioMath'
import type { MarketData, StoredPortfolio } from './model'
import { daysBetween, round2 } from './units'
import { windowReturns, type Valuation, type Window } from './valuation'

/** Performance against a benchmark, time-weighted and money-weighted (spec section 14.2). */

/** Position of the last valuation on or before `day`; the first one when `day` comes before it. */
function anchorIndex(days: readonly string[], day: string): number {
  return Math.max(
    0,
    days.findLastIndex((candidate) => candidate <= day),
  )
}

function periodStart(period: PerformancePeriod, to: string, days: readonly string[]): string {
  switch (period) {
    case 'day':
      return days[Math.max(0, days.length - 2)] ?? to
    case 'mtd':
      return addDays(`${to.slice(0, 7)}-01`, -1)
    case 'ytd':
      return `${Number(to.slice(0, 4)) - 1}-12-31`
    case '1y':
      return addMonths(to, -12)
    case '3y':
      return addMonths(to, -36)
    case 'inception':
      return days[0] ?? to
  }
}

const PERIODS: readonly PerformancePeriod[] = ['day', 'mtd', 'ytd', '1y', '3y', 'inception']

function benchmarkReturn(
  closes: Map<string, number>,
  days: readonly string[],
  { start, end }: Window,
): number | null {
  const first = closes.get(days[start])
  const last = closes.get(days[end])
  return first && last ? last / first - 1 : null
}

/** GET /portfolios/{id}/performance?from=&to=&benchmark= (spec section 14.2). */
export function performanceOf(
  portfolio: StoredPortfolio,
  valuation: Valuation,
  market: MarketData,
  query: { from: string | null; to: string | null; benchmark: string | null },
): PerformanceDto {
  const { days } = valuation
  const code = query.benchmark ?? portfolio.benchmark
  const index = market.index(code)
  const to = query.to ?? market.today
  const benchmark = { code, name: index?.name ?? code, kind: 'price' as const }
  if (days.length === 0) {
    return {
      portfolioId: portfolio.id,
      benchmark,
      from: query.from ?? to,
      to,
      series: [],
      twrPct: 0,
      annualizedPct: null,
      benchmarkPct: null,
      outperformancePts: null,
      irrPct: null,
      periods: [],
    }
  }
  const end = anchorIndex(days, to)
  const toDay = days[end]
  const closes = market.indexCloses(code, days[0], toDay)
  const window = (from: string): Window => ({ start: Math.min(anchorIndex(days, from), end), end })

  const returnsOver = (range: Window) => {
    const twr = chainReturns(windowReturns(valuation, range))
    const bench = benchmarkReturn(closes, days, range)
    const length = daysBetween(days[range.start], toDay)
    return {
      twr,
      annualized: annualize(twr, length),
      bench,
      outperformance: bench === null ? null : (twr - bench) * 100,
    }
  }
  const pct = (value: number | null) => (value === null ? null : value * 100)

  const range = window(query.from ?? days[0])
  const returns = windowReturns(valuation, range)
  const portfolioIndex = valueIndex(returns, 100)
  const benchStart = closes.get(days[range.start])
  const series = portfolioIndex.map((value, offset) => {
    const day = days[range.start + offset]
    const close = closes.get(day)
    return {
      date: day,
      portfolio: round2(value),
      benchmark: benchStart && close ? round2((close / benchStart) * 100) : null,
    }
  })
  const whole = returnsOver(range)
  const flows = days
    .slice(range.start + 1, range.end + 1)
    .map((day, offset) => ({
      days: daysBetween(days[range.start], day),
      amount: valuation.flows[range.start + 1 + offset],
    }))
    .filter((flow) => flow.amount !== 0)
  const irr =
    range.end > range.start
      ? moneyWeightedReturn(
          valuation.values[range.start],
          flows,
          valuation.values[range.end],
          daysBetween(days[range.start], toDay),
        )
      : null

  const periods = PERIODS.flatMap((period): PeriodReturnDto[] => {
    const start = periodStart(period, toDay, days.slice(0, end + 1))
    // 1 and 3 years only once the track record is that long.
    if ((period === '1y' || period === '3y') && start < days[0]) return []
    const periodRange = window(start)
    const result = returnsOver(periodRange)
    return [
      {
        period,
        from: days[periodRange.start],
        twrPct: result.twr * 100,
        annualizedPct: pct(result.annualized),
        benchmarkPct: pct(result.bench),
        outperformancePts: result.outperformance,
      },
    ]
  })

  return {
    portfolioId: portfolio.id,
    benchmark,
    from: days[range.start],
    to: toDay,
    series,
    twrPct: whole.twr * 100,
    annualizedPct: pct(whole.annualized),
    benchmarkPct: pct(whole.bench),
    outperformancePts: whole.outperformance,
    irrPct: pct(irr),
    periods,
  }
}
