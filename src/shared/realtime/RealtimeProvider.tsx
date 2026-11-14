import type { ReactNode } from 'react'
import type { ChatClient, RealtimeClient, RfqClient } from './client'
import { ChatContext, RealtimeContext, RfqContext } from './context'

interface RealtimeProviderProps {
  client: RealtimeClient
  /** The hub of the messaging. */
  chat: ChatClient
  /** The hub of the RFQ; a test of another screen goes without. */
  rfq?: RfqClient
  children: ReactNode
}

/**
 * main.tsx opens the market's connection when a session starts and closes it when the session
 * ends; the app shell opens the chat's for the users who write to others, the RFQ's for those who
 * hold one of its keys.
 */
export function RealtimeProvider({ client, chat, rfq, children }: RealtimeProviderProps) {
  return (
    <RealtimeContext.Provider value={client}>
      <ChatContext.Provider value={chat}>
        <RfqContext.Provider value={rfq ?? null}>{children}</RfqContext.Provider>
      </ChatContext.Provider>
    </RealtimeContext.Provider>
  )
}
