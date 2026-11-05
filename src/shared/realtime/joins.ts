import type { ChatClient } from './client'

export interface JoinRegistry {
  /** Joins the conversation and returns the matching leave function. */
  acquire(conversationId: string): () => void
  /** A thread of the conversation shows. */
  has(conversationId: string): boolean
}

const registries = new WeakMap<ChatClient, JoinRegistry>()

/** One ref-counted registry per client, as for the securities of the market hub. */
export function getJoinRegistry(client: ChatClient): JoinRegistry {
  let registry = registries.get(client)
  if (!registry) {
    registry = createRegistry(client)
    registries.set(client, registry)
  }
  return registry
}

function createRegistry(client: ChatClient): JoinRegistry {
  const counts = new Map<string, number>()
  const report = (error: unknown) => console.warn('[realtime] join failed', error)

  // A new connection belongs to no conversation: join again the threads still on screen.
  client.onStateChange((state) => {
    if (state !== 'connected') return
    counts.forEach((_, conversationId) => client.joinConversation(conversationId).catch(report))
  })

  return {
    acquire(conversationId) {
      const count = counts.get(conversationId) ?? 0
      counts.set(conversationId, count + 1)
      if (count === 0) client.joinConversation(conversationId).catch(report)

      let released = false
      return () => {
        if (released) return
        released = true
        const current = counts.get(conversationId) ?? 0
        if (current <= 1) {
          counts.delete(conversationId)
          client.leaveConversation(conversationId).catch(report)
        } else {
          counts.set(conversationId, current - 1)
        }
      }
    },
    has: (conversationId) => counts.has(conversationId),
  }
}
