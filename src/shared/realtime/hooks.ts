import { useCallback, useContext, useEffect, useRef, useSyncExternalStore } from 'react'
import type { ConnectionState, RealtimeClient } from './client'
import { RealtimeContext } from './context'
import type { RealtimeEventName, RealtimeHandler } from './events'
import { getSubscriptionRegistry } from './subscriptions'

export function useRealtimeClient(): RealtimeClient {
  const client = useContext(RealtimeContext)
  if (!client) throw new Error('useRealtimeClient() must be used inside <RealtimeProvider>.')
  return client
}

/** Calls the latest `handler` for every `event` received while the component is mounted. */
export function useRealtimeEvent<E extends RealtimeEventName>(
  event: E,
  handler: RealtimeHandler<E>,
) {
  const client = useRealtimeClient()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => client.on(event, (payload) => handlerRef.current(payload)), [client, event])
}

/**
 * Subscribes to the live values of the securities and indices shown by the calling component:
 * the hub sends QuoteUpdated and IndexUpdated only to the connections that follow the symbol.
 */
export function useSymbolSubscription(symbols: readonly string[]) {
  const client = useRealtimeClient()
  const key = [...new Set(symbols)].sort().join('|')

  useEffect(() => {
    if (!key) return
    return getSubscriptionRegistry(client).acquire(key.split('|'))
  }, [client, key])
}

export function useConnectionState(): ConnectionState {
  const client = useRealtimeClient()
  const subscribe = useCallback((onChange: () => void) => client.onStateChange(onChange), [client])
  return useSyncExternalStore(subscribe, () => client.state)
}
