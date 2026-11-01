import type { IssuerWeightDto, PortfolioLimit, PositionsDto, RiskDto } from '@/shared/api/contracts'
import { addDays } from '@/shared/lib/isoDate'
import {
  annualizedReturn,
  beta,
  herfindahl,
  historicalVar,
  maxDrawdown,
  trackingError,
  valueIndex,
  volatility,
} from '../portfolioMath'
import type { MarketData, StoredPortfolio } from './model'
import { round2 } from './units'
import { windowReturns, type Valuation } from './valuation'

/** Market risk over a rolling year, concentration and the limits breached (spec section 14.3). */

/** Below this many daily returns, the market risk metrics read "insufficient data". */
export const MIN_OBSERVATIONS = 60

function issuerWeights(positions: PositionsDto): IssuerWeightDto[] {
  const weights = new Map<string, number>()
  for (const position of positions.items) {
    weights.set(position.issuer, (weights.get(position.issuer) ?? 0) + position.weightPct)
  }
  return [...weights]
    .map(([issuer, weightPct]) => ({ issuer, weightPct }))
    .sort((a, b) => b.weightPct - a.weightPct)
}

/** Limits breached by the metrics: drawdowns are negative, their limit a positive depth. */
function breachesOf(risk: Omit<RiskDto, 'breaches'>): PortfolioLimit[] {
  const { limits } = risk
  const above = (value: number | null | undefined, limit: number | null) =>
    value !== null && value !== undefined && limit !== null && value > limit
  const breaches: PortfolioLimit[] = []
  if (above(risk.issuers.at(0)?.weightPct, limits.issuerWeightPct)) breaches.push('issuerWeightPct')
  if (above(risk.volatilityPct, limits.volatilityPct)) breaches.push('volatilityPct')
  if (above(risk.maxDrawdownPct === null ? null : -risk.maxDrawdownPct, limits.drawdownPct)) {
    breaches.push('drawdownPct')
  }
  if (above(risk.beta, limits.beta)) breaches.push('beta')
  if (above(risk.durationYears, limits.durationYears)) breaches.push('durationYears')
  return breaches
}

/** GET /portfolios/{id}/risk: a rolling year of daily returns (spec section 14.3). */
export function riskOf(
  portfolio: StoredPortfolio,
  valuation: Valuation,
  positions: PositionsDto,
  market: MarketData,
): RiskDto {
  const { days } = valuation
  const { today } = market
  const yearAgo = addDays(today, -365)
  const end = days.length - 1
  // The return of the first day in the window is measured from the day before it.
  const firstInWindow = days.findIndex((day) => day > yearAgo)
  const start = firstInWindow === -1 ? end : Math.max(0, firstInWindow - 1)
  const range = { start: Math.max(0, start), end: Math.max(0, end) }
  const returns = end > 0 ? windowReturns(valuation, range) : []
  const sessionsPerYear = market.sessions(addDays(today, -364), today).length
  const code = portfolio.benchmark
  const closes =
    days.length > 0 ? market.indexCloses(code, days[range.start], today) : new Map<string, number>()
  const benchmarkReturns = days.slice(range.start + 1, range.end + 1).map((day, offset) => {
    const before = closes.get(days[range.start + offset])
    const after = closes.get(day)
    return before && after ? after / before - 1 : 0
  })
  const enough = returns.length >= MIN_OBSERVATIONS
  const sigma = enough ? volatility(returns, sessionsPerYear) : null
  const annual = enough ? annualizedReturn(returns, sessionsPerYear) : null
  const benchAnnual = enough ? annualizedReturn(benchmarkReturns, sessionsPerYear) : null
  const te = enough ? trackingError(returns, benchmarkReturns, sessionsPerYear) : null
  const drawdown = enough ? maxDrawdown(valueIndex(returns)) : null
  const dayAt = (offset: number) => (offset < 0 ? null : (days[range.start + offset] ?? null))
  const rf = market.riskFreeRatePct / 100
  const varFraction = enough ? historicalVar(returns) : null

  const bonds = positions.items.filter((position) => position.modifiedDuration !== null)
  const bondValue = bonds.reduce((sum, position) => sum + position.value, 0)
  const lineDays = positions.items.length * returns.length
  const quiet = positions.items.reduce(
    (sum, position) =>
      sum + market.quietDays(position.securityId, days[range.start + 1] ?? today, today),
    0,
  )

  const risk: Omit<RiskDto, 'breaches'> = {
    portfolioId: portfolio.id,
    from: days[range.start] ?? today,
    to: days[range.end] ?? today,
    observations: returns.length,
    minObservations: MIN_OBSERVATIONS,
    sessionsPerYear,
    staleDaysPct: lineDays > 0 ? (quiet / lineDays) * 100 : 0,
    benchmark: { code, name: market.index(code)?.name ?? code },
    volatilityPct: sigma === null ? null : sigma * 100,
    benchmarkVolatilityPct: enough ? volatility(benchmarkReturns, sessionsPerYear) * 100 : null,
    maxDrawdownPct: drawdown ? drawdown.value * 100 : null,
    drawdownPeak: drawdown ? dayAt(drawdown.peak) : null,
    drawdownTrough: drawdown ? dayAt(drawdown.trough) : null,
    beta: enough ? beta(returns, benchmarkReturns) : null,
    annualizedReturnPct: annual === null ? null : annual * 100,
    sharpe: annual === null || !sigma ? null : (annual - rf) / sigma,
    riskFreeRatePct: market.riskFreeRatePct,
    trackingErrorPct: te === null ? null : te * 100,
    informationRatio:
      annual === null || benchAnnual === null || !te ? null : (annual - benchAnnual) / te,
    var95Pct: varFraction === null ? null : varFraction * 100,
    var95Amount: varFraction === null ? null : round2(varFraction * positions.totalValue),
    durationYears:
      bondValue > 0
        ? bonds.reduce(
            (sum, position) => sum + position.value * (position.modifiedDuration ?? 0),
            0,
          ) / bondValue
        : null,
    issuers: issuerWeights(positions),
    hhi: herfindahl(positions.items.map((position) => position.weightPct / 100)),
    lines: positions.items.length,
    limits: portfolio.limits,
  }
  return { ...risk, breaches: breachesOf(risk) }
}
