import { createContext } from 'react'
import type { ChatClient, RealtimeClient } from './client'

export const RealtimeContext = createContext<RealtimeClient | null>(null)

export const ChatContext = createContext<ChatClient | null>(null)
