import { toMarketDay } from '@/shared/lib/format'
import { BOND_FIXTURES, cashFlows } from '../fixtures/bonds'
import { createPortfolios } from '../fixtures/portfolios'
import { PROFILE_FIXTURES } from '../fixtures/profiles'
import { priceHistory, sessionStarted } from '../lib/bars'
import type { MarketData, PortfolioBond, StoredPortfolio } from '../lib/portfolioEngine'
import { businessDays } from '../lib/time'
import { indexDailyCloses, indices, securities } from './market'
import { settingsStore } from './platform'
import { currentAccountType, userStore } from './session'

/** The market data the portfolio service reads, and each user's portfolios. */

/** EUR / XAF peg (spec section 14.2). */
const EUR_XAF = 655.957

/** The market data of the mock, as the portfolio service reads it. */
export function marketData(now = Date.now()): MarketData {
  const bonds = new Map<string, PortfolioBond | undefined>()
  const dailyBars = (id: string, from: string, to: string) => {
    const security = securities.get(id)
    return security ? priceHistory(security, from, to, '1d', now) : []
  }
  return {
    today: toMarketDay(now),
    security(id) {
      const security = securities.get(id)
      if (!security) return undefined
      const { code, name, type, sector, country, currency } = security
      const issuer = BOND_FIXTURES[id]?.issuer ?? PROFILE_FIXTURES[id]?.issuer ?? name
      return { id, code, name, type, sector, country, currency, issuer }
    },
    quote(id) {
      const security = securities.get(id)
      if (!security) return undefined
      return {
        last: security.last,
        previousClose: security.previousClose,
        tradedToday: security.volume > 0,
        isDelayed: currentAccountType() === 'student',
      }
    },
    closes: (id, from, to) =>
      new Map(dailyBars(id, from, to).map((bar) => [toMarketDay(bar.time), bar.close])),
    quietDays: (id, from, to) => dailyBars(id, from, to).filter((bar) => bar.volume === 0).length,
    bond(id) {
      if (!bonds.has(id)) {
        const terms = BOND_FIXTURES[id]
        bonds.set(id, terms && { ...terms, schedule: cashFlows(terms) })
      }
      return bonds.get(id)
    },
    dividends: (id) => PROFILE_FIXTURES[id]?.dividends ?? [],
    sessions: (from, to) => businessDays(from, to).filter((day) => sessionStarted(day, now)),
    index(code) {
      const index = indices.get(code)
      return index && { code, name: index.name }
    },
    indexCloses: (code, from, to) =>
      new Map((indexDailyCloses(code, from, to, now) ?? []).map(({ day, close }) => [day, close])),
    fx(from, to) {
      if (from === to) return 1
      if (from === 'EUR' && to === 'XAF') return EUR_XAF
      if (from === 'XAF' && to === 'EUR') return 1 / EUR_XAF
      return 1
    },
    // Set by the Admin (spec section 14.3).
    riskFreeRatePct: settingsStore.read().riskFreeRatePct,
  }
}

/** Built from the price history the first time a user opens PORT, then kept like the rest. */
export const portfolioStore = userStore<StoredPortfolio[]>('portfolios', () =>
  createPortfolios(currentAccountType(), marketData()),
)
