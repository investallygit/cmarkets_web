import type { ReactNode } from 'react'
import type { RealtimeClient } from './client'
import { RealtimeContext } from './context'

interface RealtimeProviderProps {
  client: RealtimeClient
  children: ReactNode
}

/** The connection is started once in main.tsx and lives as long as the app. */
export function RealtimeProvider({ client, children }: RealtimeProviderProps) {
  return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>
}
