import { createContext } from 'react'
import type { RealtimeClient } from './client'

export const RealtimeContext = createContext<RealtimeClient | null>(null)
