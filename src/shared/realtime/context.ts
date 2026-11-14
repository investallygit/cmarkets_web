import { createContext } from 'react'
import type { ChatClient, RealtimeClient, RfqClient } from './client'

export const RealtimeContext = createContext<RealtimeClient | null>(null)

export const ChatContext = createContext<ChatClient | null>(null)

/** Null where no RFQ hub is given (a test of another screen): its hooks then do nothing. */
export const RfqContext = createContext<RfqClient | null>(null)
