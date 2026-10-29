import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { ConnectionState, RealtimeClient } from './client'

const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000]

export function createSignalRRealtimeClient(hubUrl: string): RealtimeClient {
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  const stateListeners = new Set<(state: ConnectionState) => void>()
  let state: ConnectionState = 'disconnected'
  let stopped = false
  let failedAttempts = 0

  function setState(next: ConnectionState) {
    state = next
    stateListeners.forEach((listener) => listener(next))
  }

  // withAutomaticReconnect only covers drops after a successful start; this covers the rest.
  async function connect(): Promise<void> {
    if (stopped || connection.state !== HubConnectionState.Disconnected) return
    setState(failedAttempts === 0 ? 'connecting' : 'reconnecting')
    try {
      await connection.start()
      failedAttempts = 0
      setState('connected')
    } catch (error) {
      const delay = RETRY_DELAYS_MS[Math.min(failedAttempts, RETRY_DELAYS_MS.length - 1)]
      failedAttempts += 1
      setState('disconnected')
      console.warn(`[realtime] cannot reach ${hubUrl}, retrying in ${delay / 1000} s`, error)
      window.setTimeout(() => void connect(), delay)
    }
  }

  connection.onreconnecting(() => setState('reconnecting'))
  connection.onreconnected(() => setState('connected'))
  connection.onclose(() => {
    setState('disconnected')
    if (!stopped) void connect()
  })

  async function invoke(method: 'Subscribe' | 'Unsubscribe', symbols: string[]) {
    // While disconnected there is nothing to do: subscriptions are resent on connect.
    if (symbols.length === 0 || connection.state !== HubConnectionState.Connected) return
    await connection.invoke(method, symbols)
  }

  return {
    get state() {
      return state
    },
    start() {
      stopped = false
      return connect()
    },
    async stop() {
      stopped = true
      await connection.stop()
    },
    subscribe: (symbols) => invoke('Subscribe', symbols),
    unsubscribe: (symbols) => invoke('Unsubscribe', symbols),
    on(event, handler) {
      connection.on(event, handler)
      return () => connection.off(event, handler)
    },
    onStateChange(listener) {
      stateListeners.add(listener)
      return () => stateListeners.delete(listener)
    },
  }
}
