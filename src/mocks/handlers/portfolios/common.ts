import type { Permission } from '@/shared/api/contracts'
import { currentUser, portfolioStore, sharedPortfolios } from '../../db'
import type { StoredAccount } from '../../fixtures/accounts'
import { problem } from '../../lib/http'
import {
  portfolioValuation,
  type MarketData,
  type StoredPortfolio,
  type Valuation,
} from '../../lib/portfolioEngine'

/**
 * What the portfolio routes share: the permission checks, the portfolio a route names, and its
 * valuation, kept a moment so that the panels of one screen share the work.
 */

export type Errors = Record<string, string[]>

export const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
export const forbidden = (detail: string) => problem(403, 'Forbidden', detail)
const notFound = (id: unknown) => problem(404, 'Portfolio not found', `No portfolio ${String(id)}.`)
export const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)

export function savePortfolio(portfolios: readonly StoredPortfolio[], updated: StoredPortfolio) {
  portfolioStore.write(
    portfolios.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
  )
}

/** Valuations are kept a moment, so the panels of one screen share the work. */
const VALUATION_TTL_MS = 1_500
const valuations = new WeakMap<StoredPortfolio, { at: number; valuation: Valuation }>()

export function valuationOf(portfolio: StoredPortfolio, market: MarketData): Valuation {
  const cached = valuations.get(portfolio)
  if (cached && Date.now() - cached.at < VALUATION_TTL_MS) return cached.valuation
  const valuation = portfolioValuation(portfolio, market)
  valuations.set(portfolio, { at: Date.now(), valuation })
  return valuation
}

interface FoundPortfolio {
  /** The user's own portfolios. */
  portfolios: StoredPortfolio[]
  portfolio: StoredPortfolio
  /** The colleague who shares the portfolio; null for the user's own. */
  owner: StoredAccount | null
}

/**
 * Reads the portfolio named by the route, after the permission checks: one of the user's, or one
 * a colleague shares with the organisation, which only its owner changes.
 */
export function withPortfolio(
  permission: Permission,
  id: unknown,
): FoundPortfolio | { response: Response } {
  if (!allowed('portfolios:read') || !allowed(permission)) {
    return { response: forbidden('Your account type has no access to this function.') }
  }
  const portfolios = portfolioStore.read()
  const portfolio = portfolios.find((candidate) => candidate.id === id)
  if (portfolio) return { portfolios, portfolio, owner: null }
  const shared = sharedPortfolios().find((candidate) => candidate.portfolio.id === id)
  if (!shared) return { response: notFound(id) }
  if (permission !== 'portfolios:read') {
    return {
      response: forbidden(
        `${shared.owner.displayName} shares this portfolio to read: only they change it.`,
      ),
    }
  }
  return { portfolios, ...shared }
}
