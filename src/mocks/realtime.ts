import type {
  ConnectionState,
  RealtimeClient,
  RealtimeEventMap,
  RealtimeEventName,
} from '@/shared/realtime'
import type { NotificationDto } from '@/shared/api/contracts'
import {
  changePct,
  indices,
  securities,
  type MockIndex,
  type MockSecurity,
  onAlertTriggered,
  onPublicationPublished,
  publishNextNews,
  tickIndex,
  tickSecurity,
} from './db'
import { onNewsEntered } from './content'
import { onImportEvent } from './imports'

type AnyHandler = (payload: unknown) => void

function quoteOf(security: MockSecurity): RealtimeEventMap['QuoteUpdated'] {
  return {
    symbol: security.id,
    last: security.last,
    change: security.last - security.previousClose,
    changePct: changePct(security.last, security.previousClose),
    volume: security.volume,
    ts: security.updatedAt,
  }
}

const QUOTE_TICK_MS = 1_200
const INDEX_TICK_MS = 4_000
const NEWS_EVERY_MS = 45_000

/** Simulates the /hubs/market SignalR hub with the same messages (spec section 10). */
export function createMockRealtimeClient(): RealtimeClient {
  const handlers = new Map<RealtimeEventName, Set<AnyHandler>>()
  const stateListeners = new Set<(state: ConnectionState) => void>()
  const subscribed = new Set<string>()
  const timers: number[] = []
  let stopAlerts: (() => void) | null = null
  let stopPublications: (() => void) | null = null
  let stopImports: (() => void) | null = null
  let stopNews: (() => void) | null = null
  let state: ConnectionState = 'disconnected'

  function setState(next: ConnectionState) {
    state = next
    stateListeners.forEach((listener) => listener(next))
  }

  function emit<E extends RealtimeEventName>(event: E, payload: RealtimeEventMap[E]) {
    handlers.get(event)?.forEach((handler) => handler(payload))
  }

  // Only subscribed securities trade, a few per tick, like a thin market.
  function tickQuotes() {
    const symbols = [...subscribed]
    if (symbols.length === 0) return
    const trades = 1 + Math.floor(Math.random() * Math.min(3, symbols.length))
    for (let trade = 0; trade < trades; trade++) {
      const result = tickSecurity(symbols[Math.floor(Math.random() * symbols.length)])
      if (!result) continue
      const { security, alerts } = result
      emit('QuoteUpdated', quoteOf(security))
      alerts.forEach(emitAlert)
    }
  }

  function emitIndex(index: MockIndex) {
    emit('IndexUpdated', {
      code: index.code,
      value: index.value,
      changePct: changePct(index.value, index.previousClose),
      ts: index.updatedAt,
    })
  }

  function tickIndices() {
    for (const code of indices.keys()) {
      const index = tickIndex(code)
      if (index) emitIndex(index)
    }
  }

  function publishNews() {
    const published = publishNextNews()
    if (!published) return
    const { item, alerts } = published
    emit('NewsPublished', {
      id: item.id,
      title: item.headline,
      securityIds: item.securityIds,
      ts: item.publishedAt,
    })
    alerts.forEach(emitAlert)
  }

  // The user's alerts are checked against each trade and each news item, as the server would.
  function emitAlert(notification: NotificationDto) {
    emit('AlertTriggered', {
      alertId: notification.alertId ?? notification.id,
      message: notification.message,
      ts: notification.triggeredAt,
    })
  }

  return {
    get state() {
      return state
    },
    async start() {
      if (state !== 'disconnected') return
      setState('connecting')
      await new Promise((resolve) => window.setTimeout(resolve, 300))
      setState('connected')
      timers.push(
        window.setInterval(tickQuotes, QUOTE_TICK_MS),
        window.setInterval(tickIndices, INDEX_TICK_MS),
        window.setInterval(publishNews, NEWS_EVERY_MS),
      )
      // Portfolio limits are checked when a transaction or a limit changes.
      stopAlerts = onAlertTriggered(emitAlert)
      stopPublications = onPublicationPublished((event) => emit('PublicationPublished', event))
      // The checks of an upload step by step, then its publication (screen 6).
      stopImports = onImportEvent((event) => {
        if (event.name === 'ImportStatusChanged') return emit('ImportStatusChanged', event.payload)
        emit('DataPublished', event.payload)
        // Today's file sets the last prices: the screens get them as ticks.
        securities.forEach((security) => emit('QuoteUpdated', quoteOf(security)))
        indices.forEach((index) => emitIndex(index))
      })
      stopNews = onNewsEntered((item) =>
        emit('NewsPublished', {
          id: item.id,
          title: item.headline,
          securityIds: item.securityIds,
          ts: item.publishedAt,
        }),
      )
    },
    async stop() {
      timers.splice(0).forEach((timer) => window.clearInterval(timer))
      stopAlerts?.()
      stopAlerts = null
      stopPublications?.()
      stopPublications = null
      stopImports?.()
      stopImports = null
      stopNews?.()
      stopNews = null
      setState('disconnected')
    },
    async subscribe(symbols) {
      symbols.forEach((symbol) => subscribed.add(symbol))
    },
    async unsubscribe(symbols) {
      symbols.forEach((symbol) => subscribed.delete(symbol))
    },
    on(event, handler) {
      let eventHandlers = handlers.get(event)
      if (!eventHandlers) {
        eventHandlers = new Set()
        handlers.set(event, eventHandlers)
      }
      const anyHandler = handler as unknown as AnyHandler
      eventHandlers.add(anyHandler)
      return () => eventHandlers.delete(anyHandler)
    },
    onStateChange(listener) {
      stateListeners.add(listener)
      return () => stateListeners.delete(listener)
    },
  }
}
