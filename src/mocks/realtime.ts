import type {
  ConnectionState,
  RealtimeClient,
  RealtimeEventMap,
  RealtimeEventName,
} from '@/shared/realtime'
import type { NotificationDto } from '@/shared/api/contracts'
import { changePct, indices, publishNextNews, tickIndex, tickSecurity } from './db'

type AnyHandler = (payload: unknown) => void

const QUOTE_TICK_MS = 1_200
const INDEX_TICK_MS = 4_000
const NEWS_EVERY_MS = 45_000

/** Simulates the /hubs/market SignalR hub with the same messages (spec section 10). */
export function createMockRealtimeClient(): RealtimeClient {
  const handlers = new Map<RealtimeEventName, Set<AnyHandler>>()
  const stateListeners = new Set<(state: ConnectionState) => void>()
  const subscribed = new Set<string>()
  const timers: number[] = []
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
      emit('QuoteUpdated', {
        symbol: security.id,
        last: security.last,
        change: security.last - security.previousClose,
        changePct: changePct(security.last, security.previousClose),
        volume: security.volume,
        ts: security.updatedAt,
      })
      alerts.forEach(emitAlert)
    }
  }

  function tickIndices() {
    for (const code of indices.keys()) {
      const index = tickIndex(code)
      if (!index) continue
      emit('IndexUpdated', {
        code,
        value: index.value,
        changePct: changePct(index.value, index.previousClose),
        ts: index.updatedAt,
      })
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
    },
    async stop() {
      timers.splice(0).forEach((timer) => window.clearInterval(timer))
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
