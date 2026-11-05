import { useCallback, useContext, useEffect, useRef } from 'react'
import type { ChatClient } from './client'
import { ChatContext } from './context'
import type { ChatEventName, ChatHandler } from './events'
import { getJoinRegistry } from './joins'

export function useChatClient(): ChatClient {
  const client = useContext(ChatContext)
  if (!client) throw new Error('useChatClient() must be used inside <RealtimeProvider>.')
  return client
}

/** Connects the chat hub while `enabled`: a user who writes to others. */
export function useChatConnection(enabled: boolean) {
  const client = useChatClient()
  useEffect(() => {
    if (!enabled) return
    void client.start()
    return () => void client.stop()
  }, [client, enabled])
}

/** Calls the latest `handler` for every `event` of the chat hub while the component is mounted. */
export function useChatEvent<E extends ChatEventName>(event: E, handler: ChatHandler<E>) {
  const client = useChatClient()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => client.on(event, (payload) => handlerRef.current(payload)), [client, event])
}

/** JoinConversation while the thread shows, LeaveConversation after it; again after a reconnect. */
export function useJoinConversation(conversationId: string | null) {
  const client = useChatClient()
  useEffect(() => {
    if (!conversationId) return
    return getJoinRegistry(client).acquire(conversationId)
  }, [client, conversationId])
}

/** Whether a thread of the conversation shows, joined by useJoinConversation. */
export function useIsJoined(): (conversationId: string) => boolean {
  const client = useChatClient()
  return useCallback((conversationId) => getJoinRegistry(client).has(conversationId), [client])
}
