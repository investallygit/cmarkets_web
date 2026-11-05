import type { ReactNode } from 'react'
import type { ChatClient, RealtimeClient } from './client'
import { ChatContext, RealtimeContext } from './context'

interface RealtimeProviderProps {
  client: RealtimeClient
  /** The hub of the messaging. */
  chat: ChatClient
  children: ReactNode
}

/**
 * main.tsx opens the market's connection when a session starts and closes it when the session
 * ends; the app shell opens the chat's for the users who write to others.
 */
export function RealtimeProvider({ client, chat, children }: RealtimeProviderProps) {
  return (
    <RealtimeContext.Provider value={client}>
      <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
    </RealtimeContext.Provider>
  )
}
