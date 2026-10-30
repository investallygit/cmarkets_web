import { useSyncExternalStore } from 'react'
import { getSessionState, onSessionChange, type SessionState } from '@/shared/api'

/** Whether the user is logged in, and why the last session ended. */
export function useSessionState(): SessionState {
  return useSyncExternalStore(onSessionChange, getSessionState)
}
