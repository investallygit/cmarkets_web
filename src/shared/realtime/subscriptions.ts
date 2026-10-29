import type { RealtimeClient } from './client'

export interface SubscriptionRegistry {
  /** Subscribes to the symbols and returns the matching release function. */
  acquire(symbols: readonly string[]): () => void
}

const registries = new WeakMap<RealtimeClient, SubscriptionRegistry>()

/** One ref-counted registry per client, since several panels can show the same security. */
export function getSubscriptionRegistry(client: RealtimeClient): SubscriptionRegistry {
  let registry = registries.get(client)
  if (!registry) {
    registry = createRegistry(client)
    registries.set(client, registry)
  }
  return registry
}

function createRegistry(client: RealtimeClient): SubscriptionRegistry {
  const counts = new Map<string, number>()
  const report = (error: unknown) => console.warn('[realtime] subscription failed', error)

  // A new connection starts without subscriptions: resend everything still on screen.
  client.onStateChange((state) => {
    if (state === 'connected' && counts.size > 0) client.subscribe([...counts.keys()]).catch(report)
  })

  return {
    acquire(symbols) {
      const unique = [...new Set(symbols)]
      const added: string[] = []
      for (const symbol of unique) {
        const count = counts.get(symbol) ?? 0
        counts.set(symbol, count + 1)
        if (count === 0) added.push(symbol)
      }
      if (added.length > 0) client.subscribe(added).catch(report)

      let released = false
      return () => {
        if (released) return
        released = true
        const removed: string[] = []
        for (const symbol of unique) {
          const count = counts.get(symbol) ?? 0
          if (count <= 1) {
            counts.delete(symbol)
            removed.push(symbol)
          } else {
            counts.set(symbol, count - 1)
          }
        }
        if (removed.length > 0) client.unsubscribe(removed).catch(report)
      }
    },
  }
}
