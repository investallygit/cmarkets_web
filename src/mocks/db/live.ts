import type { AlertCondition, NewsItemDto, NotificationDto } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { createAlerts, type StoredAlert } from '../fixtures/alerts'
import { createNotifications, UPCOMING_NEWS } from '../fixtures/feeds'
import {
  crossesThreshold,
  exceedsVolume,
  quoteAlertMessage,
  severityOf,
  type QuoteState,
} from '../lib/alerts'
import {
  changePct,
  indices,
  news,
  securities,
  startedAt,
  type MockIndex,
  type MockSecurity,
} from './market'
import { hasSession, userStore } from './session'

/**
 * The live market: trades and index moves, news as it comes out, and the user's alerts they set
 * off, as notifications for the simulated hub to push.
 */

/** Trades kept per security for GET /securities/{id}/trades. */
const MAX_TRADES = 50

export const notifications: NotificationDto[] = createNotifications(startedAt)

const upcomingNews = [...UPCOMING_NEWS]

function quoteState(security: MockSecurity): QuoteState {
  return {
    last: security.last,
    changePct: changePct(security.last, security.previousClose),
    volume: security.volume,
  }
}

/**
 * One trade: a small random move, pulled back toward the opening level, on the tick size.
 * Returns the notifications of the user's alerts that the trade set off.
 */
export function tickSecurity(
  id: string,
): { security: MockSecurity; alerts: NotificationDto[] } | undefined {
  const security = securities.get(id)
  if (!security) return undefined
  const before = quoteState(security)
  const bond = security.type === 'bond'
  const tickSize = bond ? 0.01 : 5
  const noise = (Math.random() - 0.5) * (bond ? 0.0008 : 0.004)
  const pull = ((security.anchor - security.last) / security.anchor) * 0.15
  const next = Math.round((security.last * (1 + noise + pull)) / tickSize) * tickSize
  const quantity = Math.ceil(Math.random() * (bond ? 40 : 12))
  security.last = Number(Math.max(tickSize, next).toFixed(bond ? 2 : 0))
  security.high = Math.max(security.high, security.last)
  security.low = Math.min(security.low, security.last)
  security.volume += quantity
  security.updatedAt = new Date().toISOString()
  security.sparkline[security.sparkline.length - 1] = security.last
  security.trades.unshift({ time: security.updatedAt, price: security.last, quantity })
  security.trades.length = Math.min(security.trades.length, MAX_TRADES)
  return { security, alerts: checkQuoteAlerts(security, before) }
}

export function tickIndex(code: string): MockIndex | undefined {
  const index = indices.get(code)
  if (!index) return undefined
  const noise = (Math.random() - 0.5) * 0.0012
  const pull = ((index.anchor - index.value) / index.anchor) * 0.1
  index.value = Number((index.value * (1 + noise + pull)).toFixed(2))
  index.updatedAt = new Date().toISOString()
  return index
}

/** Publishes the next sample news item, with the notifications of the alerts it sets off. */
export function publishNextNews(): { item: NewsItemDto; alerts: NotificationDto[] } | undefined {
  const next = upcomingNews.shift()
  if (!next) return undefined
  const { auctionResults = false, ...content } = next
  const item = {
    ...content,
    id: `news-live-${news.length + 1}`,
    publishedAt: new Date().toISOString(),
  }
  news.unshift(item)
  return { item, alerts: checkNewsAlerts(item, auctionResults) }
}

export const alertStore = userStore<StoredAlert[]>('alerts', () => createAlerts(startedAt))

/** Records that an alert went off: a notification for the user and the time on the alert. */
function triggerAlert(alert: StoredAlert, subject: string, message: string): NotificationDto {
  const triggeredAt = new Date().toISOString()
  alert.lastTriggeredAt = triggeredAt
  const notification: NotificationDto = {
    id: `notification-${notifications.length + 1}`,
    alertId: alert.id,
    triggeredAt,
    subject,
    message,
    severity: severityOf(alert.condition),
    read: false,
  }
  notifications.unshift(notification)
  return notification
}

function triggerAll(
  match: (
    condition: AlertCondition,
    alert: StoredAlert,
  ) => [subject: string, message: string] | null,
): NotificationDto[] {
  // Between a logout and the next login, nobody's alerts are watched.
  if (!hasSession()) return []
  const alerts = alertStore.read()
  const triggered = alerts.flatMap((alert) => {
    const found = alert.enabled ? match(alert.condition, alert) : null
    return found ? [triggerAlert(alert, ...found)] : []
  })
  if (triggered.length > 0) alertStore.write(alerts)
  return triggered
}

/**
 * Price and volume alerts go off when a trade crosses their threshold. The prototype lets each one
 * go off once a session, so a price hovering around the threshold does not repeat it.
 */
function checkQuoteAlerts(security: MockSecurity, before: QuoteState): NotificationDto[] {
  const after = quoteState(security)
  const today = toMarketDay(Date.now())
  return triggerAll((condition, alert) => {
    if (condition.type !== 'price' && condition.type !== 'volume') return null
    if (condition.securityId !== security.id) return null
    if (alert.lastTriggeredAt && toMarketDay(alert.lastTriggeredAt) === today) return null
    const crossed =
      condition.type === 'price'
        ? crossesThreshold(condition, before, after)
        : exceedsVolume(condition, before, after, security.typicalVolume)
    return crossed ? [security.code, quoteAlertMessage(condition, security)] : null
  })
}

const alertListeners = new Set<(notification: NotificationDto) => void>()

/** Alerts set off by a REST call rather than by a tick, for the simulated hub to push. */
export function onAlertTriggered(listener: (notification: NotificationDto) => void): () => void {
  alertListeners.add(listener)
  return () => alertListeners.delete(listener)
}

/** A portfolio limit newly breached sets off the portfolio alerts on it, or on all portfolios. */
export function triggerPortfolioAlerts(
  portfolioId: string,
  subject: string,
  message: string,
): NotificationDto[] {
  const triggered = triggerAll((condition) =>
    condition.type === 'portfolio' &&
    (condition.portfolioId === null || condition.portfolioId === portfolioId)
      ? [subject, message]
      : null,
  )
  triggered.forEach((notification) => alertListeners.forEach((listener) => listener(notification)))
  return triggered
}

/** Release alerts follow the issuer's news, auction alerts the BEAC results. */
function checkNewsAlerts(item: NewsItemDto, auctionResults: boolean): NotificationDto[] {
  return triggerAll((condition) => {
    if (
      condition.type === 'release' &&
      item.topic === 'issuer' &&
      item.securityIds.includes(condition.securityId)
    ) {
      return [item.source, `New release: ${item.headline}`]
    }
    if (
      condition.type === 'auction' &&
      auctionResults &&
      (condition.country === null || condition.country === item.country)
    ) {
      return [item.source, item.headline]
    }
    return null
  })
}
