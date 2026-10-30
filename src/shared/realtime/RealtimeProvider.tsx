import type { ReactNode } from 'react'
import type { RealtimeClient } from './client'
import { RealtimeContext } from './context'

interface RealtimeProviderProps {
  client: RealtimeClient
  children: ReactNode
}

/** main.tsx opens the connection when a session starts and closes it when the session ends. */
export function RealtimeProvider({ client, children }: RealtimeProviderProps) {
  return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>
}
