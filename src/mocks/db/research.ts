import type { PaymentMethod } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import type { RealtimeEventMap } from '@/shared/realtime'
import { REPORT_FIXTURES, type StoredReport } from '../fixtures/admin'
import {
  ANALYST_FIXTURES,
  COUNTRY_NAMES,
  createLibrary,
  FOLLOW_FIXTURES,
  READ_FIXTURES,
  type ResearchMarket,
} from '../fixtures/research'
import { priceHistory } from '../lib/bars'
import type { StoredAnalyst, StoredPublication } from '../lib/research'
import type { ReaderContext } from '../lib/researchViews'
import { securities } from './market'
import { currentUser } from './platform'
import { userStore } from './session'
import { sharedStore } from './storage'

/**
 * The research library: publications and analysts every account sees, what each reader bought,
 * read, rated and follows, and the readers' reports.
 */

/** Prices of the research library: closes on a day, and the bars of a frozen chart. */
export function researchMarket(now = Date.now()): ResearchMarket {
  return {
    today: toMarketDay(now),
    security: (id) => securities.get(id),
    closeOn(id, day) {
      const security = securities.get(id)
      return security
        ? priceHistory(security, addDays(day, -10), day, '1d', now).at(-1)?.close
        : undefined
    },
    bars(id, from, to, interval) {
      const security = securities.get(id)
      return security ? priceHistory(security, from, to, interval, now) : []
    },
  }
}

/** Publications of every analyst, shared by all accounts. */
export const publicationStore = sharedStore<StoredPublication[]>('publications', () =>
  createLibrary(researchMarket()),
)

export const analystStore = sharedStore<StoredAnalyst[]>('analysts', () =>
  ANALYST_FIXTURES.map((analyst) => ({ ...analyst })),
)

export interface StoredPurchase {
  publicationId: string
  paymentId: string
  amount: number
  method: PaymentMethod
  purchasedAt: string
}

export const purchaseStore = userStore<StoredPurchase[]>('purchases', () => [])

export const followStore = userStore<{ analystId: string }[]>('follows', () =>
  FOLLOW_FIXTURES.map((analystId) => ({ analystId })),
)

/** The user's rating of a publication, and the month it counts in. */
export const myRatingStore = userStore<{ publicationId: string; stars: number; month: string }[]>(
  'ratings',
  () => [],
)

export const readStore = userStore<{ publicationId: string }[]>('reads', () =>
  READ_FIXTURES.map((publicationId) => ({ publicationId })),
)

/** Reports of readers, for the moderation queue of the Admin (screen 9). */
export const contentReportStore = sharedStore<StoredReport[]>('contentReports', () =>
  REPORT_FIXTURES.map((report) => ({ ...report })),
)

/** The current user as the research library sees them: what they bought, read and rated. */
export function readerContext(now = Date.now()): ReaderContext {
  const user = currentUser()
  const analysts = analystStore.read()
  return {
    today: toMarketDay(now),
    user: {
      id: user.id,
      displayName: user.displayName,
      accountType: user.accountType,
      canBuy: user.permissions.includes('research:buy'),
    },
    security: (id) => securities.get(id),
    countryName: (code) => COUNTRY_NAMES[code],
    analyst: (id) => analysts.find((analyst) => analyst.id === id),
    purchases: new Map(purchaseStore.read().map((purchase) => [purchase.publicationId, purchase])),
    reads: new Set(readStore.read().map((read) => read.publicationId)),
    myRatings: new Map(myRatingStore.read().map((rating) => [rating.publicationId, rating.stars])),
  }
}

type PublicationEvent = RealtimeEventMap['PublicationPublished']
const publicationListeners = new Set<(event: PublicationEvent) => void>()

/** Publications and updates, for the simulated hub to push to followers. */
export function onPublicationPublished(listener: (event: PublicationEvent) => void): () => void {
  publicationListeners.add(listener)
  return () => publicationListeners.delete(listener)
}

export function announcePublication(event: PublicationEvent): void {
  publicationListeners.forEach((listener) => listener(event))
}
