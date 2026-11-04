import { toMarketDay } from '@/shared/lib/format'
import { isVerifiedType, type StoredAccount } from '../fixtures/accounts'
import { BOND_FIXTURES, cashFlows } from '../fixtures/bonds'
import { createPortfolios } from '../fixtures/portfolios'
import { PROFILE_FIXTURES } from '../fixtures/profiles'
import { isDemoUser } from '../fixtures/users'
import { priceHistory, sessionStarted } from '../lib/bars'
import type { MarketData, PortfolioBond, StoredPortfolio } from '../lib/portfolioEngine'
import { businessDays } from '../lib/time'
import { accountStore, findAccount } from './accounts'
import { indexDailyCloses, indices, securities } from './market'
import { settingsStore } from './platform'
import { currentAccount, currentAccountType, usersStore } from './session'
import { userArray } from './storage'

/** The market data the portfolio service reads, each user's portfolios, and those shared. */

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

/**
 * The portfolios of the current user, or of the user named. Built from the price history the
 * first time they are read, then kept like the rest.
 */
export const portfolioStore = usersStore<StoredPortfolio[]>('portfolios', (userId) => {
  const account = findAccount(userId)
  return account ? createPortfolios(account, marketData()) : []
})

/** A portfolio a colleague shares with the organisation, and that colleague. */
export interface SharedPortfolio {
  portfolio: StoredPortfolio
  owner: StoredAccount
}

/**
 * A colleague's portfolios. A demo user starts with the sample ones; the others have those they
 * saved, as their sample ones share nothing.
 */
function portfoliosOf(account: StoredAccount): StoredPortfolio[] {
  return isDemoUser(account.id)
    ? portfolioStore.read(account.id)
    : userArray<StoredPortfolio>('portfolios', account.id)
}

/**
 * The portfolios colleagues share with the user's organisation, which the user reads without
 * changing them (spec sections 6 and 12): none while the user's status waits for an Admin's
 * approval, nor once it was rejected.
 */
export function sharedPortfolios(): SharedPortfolio[] {
  const user = currentAccount()
  if (!user.organizationId) return []
  if (isVerifiedType(user.accountType) && user.verificationStatus !== 'approved') return []
  return accountStore
    .read()
    .filter((account) => account.organizationId === user.organizationId && account.id !== user.id)
    .flatMap((owner) =>
      portfoliosOf(owner)
        .filter((portfolio) => portfolio.sharedWithOrganization)
        .map((portfolio) => ({ portfolio, owner })),
    )
}
