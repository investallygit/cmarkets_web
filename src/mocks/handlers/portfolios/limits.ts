import type { RiskDto } from '@/shared/api/contracts'
import { currentUser, triggerPortfolioAlerts } from '../../db'
import {
  positionsOf,
  riskOf,
  type MarketData,
  type StoredPortfolio,
} from '../../lib/portfolioEngine'
import { valuationOf } from './common'

/** Portfolio limits: the breaches seen at the last valuation, and the alerts a new one sets off. */

/**
 * Breaches seen at the last valuation, per user and portfolio: a limit, or for the limit on one
 * issuer each issuer above it, so a second issuer going over sets the alerts off again.
 */
const knownBreaches = new Map<string, ReadonlySet<string>>()
const breachKey = (portfolioId: string) => `${currentUser().id}|${portfolioId}`

export function riskNow(portfolio: StoredPortfolio, market: MarketData): RiskDto {
  const valuation = valuationOf(portfolio, market)
  const positions = positionsOf(portfolio, valuation, market, new Date().toISOString())
  return riskOf(portfolio, valuation, positions, market)
}

interface Breach {
  key: string
  message: string
}

function breachesOf(risk: RiskDto): Breach[] {
  const pct = (number: number | null | undefined) => `${(number ?? 0).toFixed(1)}%`
  return risk.breaches.flatMap((limit): Breach[] => {
    const value = risk.limits[limit]
    switch (limit) {
      case 'issuerWeightPct':
        return risk.issuers
          .filter((issuer) => value !== null && issuer.weightPct > value)
          .map((issuer) => ({
            key: `${limit}|${issuer.issuer}`,
            message: `${issuer.issuer} is ${pct(issuer.weightPct)} of the portfolio, above the ${value}% limit on one issuer.`,
          }))
      case 'volatilityPct':
        return [
          {
            key: limit,
            message: `Volatility ${pct(risk.volatilityPct)}, above the ${value}% limit.`,
          },
        ]
      case 'drawdownPct':
        return [
          {
            key: limit,
            message: `Drawdown ${pct(risk.maxDrawdownPct)}, beyond the -${value}% limit.`,
          },
        ]
      case 'beta':
        return [
          { key: limit, message: `Beta ${(risk.beta ?? 0).toFixed(2)}, above the ${value} limit.` },
        ]
      case 'durationYears':
        return [
          {
            key: limit,
            message: `Bond sleeve duration ${(risk.durationYears ?? 0).toFixed(2)} years, above the ${value}-year limit.`,
          },
        ]
    }
  })
}

/**
 * Checks the limits after a valuation (spec section 14.3): a breach that was not there sets off
 * the user's portfolio alerts. The first check of a portfolio only notes what is breached.
 */
export function checkLimits(
  portfolio: StoredPortfolio,
  market: MarketData,
  risk = riskNow(portfolio, market),
) {
  const key = breachKey(portfolio.id)
  const before = knownBreaches.get(key)
  const breaches = breachesOf(risk)
  knownBreaches.set(key, new Set(breaches.map((breach) => breach.key)))
  if (!before) return
  for (const breach of breaches.filter((candidate) => !before.has(candidate.key))) {
    triggerPortfolioAlerts(portfolio.id, portfolio.name, breach.message)
  }
}

/** Notes the breaches before a change, so that only the ones it causes set off alerts. */
export function noteLimits(portfolio: StoredPortfolio, market: MarketData) {
  if (!knownBreaches.has(breachKey(portfolio.id))) checkLimits(portfolio, market)
}
